"""
Model Manager for IBM Granite 2B Instruct
=========================================

Thread-safe model loading and generation with proper memory management.
"""

import logging
import torch
import gc
import threading
from typing import Optional, Tuple, Any
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    BitsAndBytesConfig,
    GenerationConfig
)
import psutil
from contextlib import contextmanager

logger = logging.getLogger(__name__)

class ModelManager:
    """
    Thread-safe model manager with proper resource management and error handling.
    """

    def __init__(self, config):
        self.config = config
        self.model = None
        self.tokenizer = None
        self.generation_config = None
        self._model_lock = threading.Lock()
        self._is_loaded = False
        self._device = self._determine_device()

        logger.info(f"ModelManager initialized with device: {self._device}")

    def _determine_device(self) -> str:
        """Determine the best available device"""
        if self.config.device == "auto":
            if torch.cuda.is_available():
                gpu_memory = torch.cuda.get_device_properties(0).total_memory / (1024**3)
                if gpu_memory >= 4.0:  # Need at least 4GB for 2B model
                    return "cuda:0"
                else:
                    logger.warning(f"GPU has only {gpu_memory:.1f}GB, using CPU")
                    return "cpu"
            else:
                return "cpu"
        return self.config.device

    def _check_memory_requirements(self) -> bool:
        """Check if system has enough memory for the model"""
        available_memory_gb = psutil.virtual_memory().available / (1024**3)
        required_memory_gb = 4.0 if self.config.use_4bit_quantization else 8.0

        if available_memory_gb < required_memory_gb:
            logger.error(f"Insufficient memory: {available_memory_gb:.1f}GB available, {required_memory_gb:.1f}GB required")
            return False

        logger.info(f"Memory check passed: {available_memory_gb:.1f}GB available, {required_memory_gb:.1f}GB required")
        return True

    def load_model(self) -> bool:
        """Load the IBM Granite model with thread safety"""
        with self._model_lock:
            if self._is_loaded:
                return True

            try:
                if not self._check_memory_requirements():
                    return False

                logger.info(f"Loading IBM Granite model: {self.config.model_name}")

                # Configure quantization if enabled
                quantization_config = None
                if self.config.use_4bit_quantization and self._device.startswith("cuda"):
                    quantization_config = BitsAndBytesConfig(
                        load_in_4bit=True,
                        bnb_4bit_compute_dtype=torch.float16,
                        bnb_4bit_use_double_quant=True,
                        bnb_4bit_quant_type="nf4"
                    )
                    logger.info("4-bit quantization enabled")

                # Load tokenizer
                logger.info("Loading tokenizer...")
                self.tokenizer = AutoTokenizer.from_pretrained(
                    self.config.model_name,
                    trust_remote_code=True,
                    padding_side="left"
                )

                if self.tokenizer.pad_token is None:
                    self.tokenizer.pad_token = self.tokenizer.eos_token

                # Load model
                logger.info("Loading model...")
                model_kwargs = {
                    "trust_remote_code": True,
                    "torch_dtype": torch.float16 if self._device.startswith("cuda") else torch.float32,
                }

                if quantization_config:
                    model_kwargs["quantization_config"] = quantization_config
                    model_kwargs["device_map"] = "auto"
                else:
                    model_kwargs["device_map"] = None

                self.model = AutoModelForCausalLM.from_pretrained(
                    self.config.model_name,
                    **model_kwargs
                )

                if not quantization_config:
                    self.model = self.model.to(self._device)

                # Configure generation parameters
                self.generation_config = GenerationConfig(
                    max_new_tokens=self.config.max_new_tokens,
                    temperature=self.config.temperature,
                    top_p=self.config.top_p,
                    do_sample=self.config.do_sample,
                    pad_token_id=self.tokenizer.pad_token_id,
                    eos_token_id=self.tokenizer.eos_token_id,
                    repetition_penalty=1.1,
                    length_penalty=1.0
                )

                self._is_loaded = True
                logger.info("Model loaded successfully")
                return True

            except Exception as e:
                logger.error(f"Failed to load model: {e}")
                self._cleanup_partial_load()
                return False

    def _cleanup_partial_load(self):
        """Clean up after partial model loading failure"""
        try:
            if hasattr(self, 'model') and self.model is not None:
                del self.model
                self.model = None

            if hasattr(self, 'tokenizer') and self.tokenizer is not None:
                del self.tokenizer
                self.tokenizer = None

            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()

        except Exception as e:
            logger.warning(f"Error during cleanup: {e}")

    def generate_response(self, prompt: str) -> str:
        """Generate response with proper error handling"""
        if not self._is_loaded:
            if not self.load_model():
                return "I apologize, but I'm currently unable to process your request due to model loading issues."

        try:
            with self._model_lock:
                return self._generate_text(prompt)

        except torch.cuda.OutOfMemoryError:
            logger.error("GPU out of memory during generation")
            self._clear_gpu_cache()
            return "I apologize, but I'm experiencing memory constraints. Please try a shorter query."

        except Exception as e:
            logger.error(f"Generation failed: {e}")
            return "I apologize, but I encountered an error while generating a response. Please try again."

    def _generate_text(self, prompt: str) -> str:
        """Internal text generation method"""
        # Tokenize input
        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=2048,
            padding=True
        )

        if not self.config.use_4bit_quantization:
            inputs = {k: v.to(self._device) for k, v in inputs.items()}

        # Generate response
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                generation_config=self.generation_config,
                use_cache=True
            )

        # Decode response
        response = self.tokenizer.decode(
            outputs[0][inputs['input_ids'].shape[1]:],
            skip_special_tokens=True
        )

        return response.strip()

    def _clear_gpu_cache(self):
        """Clear GPU cache to free memory"""
        try:
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                torch.cuda.synchronize()
            gc.collect()
            logger.info("GPU cache cleared")
        except Exception as e:
            logger.warning(f"Error clearing GPU cache: {e}")

    @contextmanager
    def memory_management(self):
        """Context manager for memory management during operations"""
        try:
            yield
        finally:
            self._clear_gpu_cache()

    def unload_model(self):
        """Safely unload the model and free resources"""
        with self._model_lock:
            try:
                if self.model is not None:
                    del self.model
                    self.model = None

                if self.tokenizer is not None:
                    del self.tokenizer
                    self.tokenizer = None

                self.generation_config = None
                self._is_loaded = False

                gc.collect()
                self._clear_gpu_cache()

                logger.info("Model unloaded successfully")

            except Exception as e:
                logger.error(f"Error unloading model: {e}")

    def get_model_info(self) -> dict:
        """Get information about the loaded model"""
        return {
            "model_name": self.config.model_name,
            "is_loaded": self._is_loaded,
            "device": self._device,
            "quantization": self.config.use_4bit_quantization,
            "memory_usage_gb": self._get_memory_usage()
        }

    def _get_memory_usage(self) -> float:
        """Get current memory usage"""
        try:
            if torch.cuda.is_available() and self._device.startswith("cuda"):
                return torch.cuda.memory_allocated() / (1024**3)
            else:
                process = psutil.Process()
                return process.memory_info().rss / (1024**3)
        except Exception:
            return 0.0
