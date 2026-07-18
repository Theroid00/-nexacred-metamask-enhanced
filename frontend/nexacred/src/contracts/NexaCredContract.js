// NexaCred Smart Contract ABI and Addresses
export const NEXACRED_CONTRACT_ADDRESSES = {
  '0xaa36a7': '0x7b233a1e948E7C815A2eFA231D12E99175a40bAA', // Sepolia Testnet
  '0x89': '0x3a429F7C28678afecb367f032d93F642f64180aa3',     // Polygon Mainnet
  '0x7a69': '0x5FbDB2315678afecb367f032d93F642f64180aa3',   // Local Hardhat Node (31337)
  'default': '0x5FbDB2315678afecb367f032d93F642f64180aa3'
};

export const NEXACRED_ABI = [
  "function requestLoan(uint256 amount, uint256 interestRate, uint256 durationDays, string calldata purpose) external returns (uint256 loanId)",
  "function fundLoan(uint256 loanId) external payable",
  "function repayLoan(uint256 loanId) external payable",
  "function withdrawFunds() external",
  "function cancelLoan(uint256 loanId) external",
  "function markDefault(uint256 loanId) external",
  "function getLoan(uint256 loanId) external view returns (tuple(uint256 id, address borrower, address lender, uint256 amount, uint256 interestRate, uint256 durationDays, uint256 creditScore, string purpose, uint8 status, uint256 createdAt, uint256 fundedAt, uint256 dueDate, uint256 totalOwed, uint256 amountRepaid))",
  "function getUserProfile(address user) external view returns (tuple(uint256 creditScore, uint256 totalBorrowed, uint256 totalLent, uint256 successfulLoans, uint256 defaultedLoans, bool kycVerified, uint256 reputation))",
  "function getBorrowingLimits(address user) external view returns (uint256 maxAmount, uint256 suggestedRate, bool eligible)",
  "event LoanRequested(uint256 indexed loanId, address indexed borrower, uint256 amount, string purpose)",
  "event LoanFunded(uint256 indexed loanId, address indexed lender, address indexed borrower, uint256 amount)",
  "event RepaymentMade(uint256 indexed loanId, uint256 amount, uint256 remaining)",
  "event LoanCompleted(uint256 indexed loanId, address indexed borrower)"
];
