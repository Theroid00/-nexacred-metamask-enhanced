# 🚀 Complete AWS Deployment Guide for NexaCred Enhanced

## Overview
This guide provides step-by-step instructions to deploy the NexaCred Enhanced platform on AWS using ECS Fargate, DocumentDB, and supporting services.

## Prerequisites

### 1. AWS Account Setup
- AWS account with admin access
- AWS CLI installed and configured
- Docker installed locally
- Node.js 18+ and Python 3.11+

### 2. Required Tools
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Install Docker
# (Platform-specific installation)

# Verify installations
aws --version
docker --version
```

## Phase 1: Infrastructure Setup

### Step 1: Create VPC and Networking
```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=nexacred-vpc}]'

# Create subnets (replace vpc-xxx with your VPC ID)
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.2.0/24 --availability-zone us-east-1b

# Create Internet Gateway
aws ec2 create-internet-gateway --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=nexacred-igw}]'

# Attach Internet Gateway to VPC
aws ec2 attach-internet-gateway --internet-gateway-id igw-xxx --vpc-id vpc-xxx
```

### Step 2: Create Security Groups
```bash
# Application Load Balancer Security Group
aws ec2 create-security-group \
  --group-name nexacred-alb-sg \
  --description "NexaCred ALB Security Group" \
  --vpc-id vpc-xxx

# ECS Service Security Group
aws ec2 create-security-group \
  --group-name nexacred-ecs-sg \
  --description "NexaCred ECS Security Group" \
  --vpc-id vpc-xxx

# Database Security Group
aws ec2 create-security-group \
  --group-name nexacred-db-sg \
  --description "NexaCred Database Security Group" \
  --vpc-id vpc-xxx
```

### Step 3: Create ECR Repositories
```bash
# Create repositories for each service
aws ecr create-repository --repository-name nexacred/frontend
aws ecr create-repository --repository-name nexacred/backend
aws ecr create-repository --repository-name nexacred/analyzer
```

## Phase 2: Database Setup

### Step 1: Create DocumentDB Cluster
```bash
# Create subnet group
aws docdb create-db-subnet-group \
  --db-subnet-group-name nexacred-subnet-group \
  --db-subnet-group-description "NexaCred DocumentDB subnet group" \
  --subnet-ids subnet-xxx subnet-yyy

# Create DocumentDB cluster
aws docdb create-db-cluster \
  --db-cluster-identifier nexacred-docdb-cluster \
  --engine docdb \
  --master-username nexacred \
  --master-user-password $(openssl rand -base64 32) \
  --vpc-security-group-ids sg-xxx \
  --db-subnet-group-name nexacred-subnet-group \
  --storage-encrypted
```

### Step 2: Create ElastiCache Redis Cluster
```bash
# Create Redis subnet group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name nexacred-redis-subnet \
  --cache-subnet-group-description "NexaCred Redis subnet group" \
  --subnet-ids subnet-xxx subnet-yyy

# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id nexacred-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --cache-subnet-group-name nexacred-redis-subnet \
  --security-group-ids sg-xxx
```

## Phase 3: Container Deployment

### Step 1: Build and Push Docker Images
```bash
# Get ECR login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Build and push frontend
cd frontend/nexacred
docker build -t nexacred/frontend .
docker tag nexacred/frontend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/nexacred/frontend:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/nexacred/frontend:latest

# Build and push backend
cd ../../backend/Backend
docker build -t nexacred/backend .
docker tag nexacred/backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/nexacred/backend:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/nexacred/backend:latest

# Build and push analyzer
cd ../services
docker build -t nexacred/analyzer .
docker tag nexacred/analyzer:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/nexacred/analyzer:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/nexacred/analyzer:latest
```

### Step 2: Create ECS Cluster
```bash
# Create ECS cluster
aws ecs create-cluster \
  --cluster-name nexacred-cluster \
  --capacity-providers FARGATE \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1
```

### Step 3: Create Task Definitions

#### Frontend Task Definition
```json
{
  "family": "nexacred-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/nexacred/frontend:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/nexacred-frontend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Backend Task Definition
```json
{
  "family": "nexacred-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/nexacred/backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:nexacred/jwt-secret"
        },
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:nexacred/mongodb-uri"
        }
      ],
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/nexacred-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Step 4: Create Application Load Balancer
```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name nexacred-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx

# Create target groups for each service
aws elbv2 create-target-group \
  --name nexacred-frontend-tg \
  --protocol HTTP \
  --port 80 \
  --vpc-id vpc-xxx \
  --target-type ip \
  --health-check-path /health

aws elbv2 create-target-group \
  --name nexacred-backend-tg \
  --protocol HTTP \
  --port 5000 \
  --vpc-id vpc-xxx \
  --target-type ip \
  --health-check-path /health

aws elbv2 create-target-group \
  --name nexacred-analyzer-tg \
  --protocol HTTP \
  --port 8000 \
  --vpc-id vpc-xxx \
  --target-type ip \
  --health-check-path /health
```

### Step 5: Create ECS Services
```bash
# Create frontend service
aws ecs create-service \
  --cluster nexacred-cluster \
  --service-name nexacred-frontend \
  --task-definition nexacred-frontend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/nexacred-frontend-tg/xxx,containerName=frontend,containerPort=80

# Create backend service
aws ecs create-service \
  --cluster nexacred-cluster \
  --service-name nexacred-backend \
  --task-definition nexacred-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx]}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/nexacred-backend-tg/xxx,containerName=backend,containerPort=5000

# Create analyzer service
aws ecs create-service \
  --cluster nexacred-cluster \
  --service-name nexacred-analyzer \
  --task-definition nexacred-analyzer:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx]}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/nexacred-analyzer-tg/xxx,containerName=analyzer,containerPort=8000
```

## Phase 4: Domain and SSL Setup

### Step 1: Request SSL Certificate
```bash
# Request certificate from ACM
aws acm request-certificate \
  --domain-name nexacred.your-domain.com \
  --subject-alternative-names api.nexacred.your-domain.com analyzer.nexacred.your-domain.com \
  --validation-method DNS
```

### Step 2: Create Route 53 Records
```bash
# Create hosted zone (if not exists)
aws route53 create-hosted-zone \
  --name your-domain.com \
  --caller-reference $(date +%s)

# Create A records pointing to ALB
# (Use Route 53 console or CLI with ALB DNS name)
```

## Phase 5: Monitoring and Logging

### Step 1: Create CloudWatch Log Groups
```bash
# Create log groups for each service
aws logs create-log-group --log-group-name /ecs/nexacred-frontend
aws logs create-log-group --log-group-name /ecs/nexacred-backend
aws logs create-log-group --log-group-name /ecs/nexacred-analyzer
```

### Step 2: Set Up CloudWatch Alarms
```bash
# CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "NexaCred-High-CPU" \
  --alarm-description "Alarm when CPU exceeds 70%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 70 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# Memory utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "NexaCred-High-Memory" \
  --alarm-description "Alarm when Memory exceeds 80%" \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

## Phase 6: CI/CD Pipeline Setup

### Create GitHub Actions Workflow
Create `.github/workflows/deploy-aws.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REGISTRY: 123456789012.dkr.ecr.us-east-1.amazonaws.com

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}
    
    - name: Login to Amazon ECR
      uses: aws-actions/amazon-ecr-login@v1
    
    - name: Build and push frontend
      working-directory: frontend/nexacred
      run: |
        docker build -t $ECR_REGISTRY/nexacred/frontend:$GITHUB_SHA .
        docker push $ECR_REGISTRY/nexacred/frontend:$GITHUB_SHA
    
    - name: Build and push backend
      working-directory: backend/Backend
      run: |
        docker build -t $ECR_REGISTRY/nexacred/backend:$GITHUB_SHA .
        docker push $ECR_REGISTRY/nexacred/backend:$GITHUB_SHA
    
    - name: Build and push analyzer
      working-directory: backend/services
      run: |
        docker build -t $ECR_REGISTRY/nexacred/analyzer:$GITHUB_SHA .
        docker push $ECR_REGISTRY/nexacred/analyzer:$GITHUB_SHA
    
    - name: Update ECS services
      run: |
        aws ecs update-service --cluster nexacred-cluster --service nexacred-frontend --force-new-deployment
        aws ecs update-service --cluster nexacred-cluster --service nexacred-backend --force-new-deployment
        aws ecs update-service --cluster nexacred-cluster --service nexacred-analyzer --force-new-deployment
```

## Phase 7: Production Verification

### Step 1: Health Checks
```bash
# Check service status
aws ecs describe-services --cluster nexacred-cluster --services nexacred-frontend nexacred-backend nexacred-analyzer

# Check target group health
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/nexacred-frontend-tg/xxx
```

### Step 2: Application Testing
```bash
# Test frontend
curl -I https://nexacred.your-domain.com/health

# Test backend API
curl -I https://api.nexacred.your-domain.com/health

# Test analyzer service
curl -I https://analyzer.nexacred.your-domain.com/health
```

## Security Best Practices

### 1. Secrets Management
- Use AWS Secrets Manager for sensitive data
- Rotate secrets regularly
- Use IAM roles instead of access keys where possible

### 2. Network Security
- Use private subnets for backend services
- Implement WAF rules for additional protection
- Enable VPC Flow Logs

### 3. Access Control
- Follow principle of least privilege
- Use separate IAM roles for each service
- Enable CloudTrail for audit logging

## Cost Optimization

### 1. Right-sizing Resources
- Monitor CPU/memory utilization
- Use Fargate Spot for development environments
- Implement auto-scaling policies

### 2. Reserved Capacity
- Purchase Reserved Instances for predictable workloads
- Use Savings Plans for flexible compute usage

### 3. Data Transfer Optimization
- Use CloudFront for static asset delivery
- Optimize database queries to reduce data transfer

## Troubleshooting Guide

### Common Issues

#### ECS Service Won't Start
```bash
# Check service events
aws ecs describe-services --cluster nexacred-cluster --services nexacred-backend

# Check task definition
aws ecs describe-task-definition --task-definition nexacred-backend:1
```

#### Database Connection Issues
```bash
# Test DocumentDB connection
mongo --ssl --host nexacred-docdb-cluster.cluster-xxx.us-east-1.docdb.amazonaws.com:27017 --sslCAFile rds-combined-ca-bundle.pem --username nexacred
```

#### Load Balancer Health Check Failures
```bash
# Check target group health
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/nexacred-backend-tg/xxx

# Check security group rules
aws ec2 describe-security-groups --group-ids sg-xxx
```

## Production Checklist

- [ ] All services deployed and healthy
- [ ] SSL certificates installed and working
- [ ] DNS records configured correctly
- [ ] Health checks passing
- [ ] Monitoring and alerting configured
- [ ] Backup strategy implemented
- [ ] Security groups properly configured
- [ ] Secrets properly managed
- [ ] CI/CD pipeline working
- [ ] Load testing completed
- [ ] Disaster recovery plan documented

## Maintenance

### Regular Tasks
- Update container images monthly
- Review and optimize costs quarterly
- Rotate secrets every 90 days
- Review security groups monthly
- Update task definitions as needed

### Monitoring
- Set up CloudWatch dashboards
- Configure SNS notifications for alerts
- Review CloudWatch Insights logs weekly

---

## Support

For deployment issues or questions:
1. Check CloudWatch logs for error details
2. Review ECS service events
3. Validate environment variables and secrets
4. Test database and cache connectivity

This deployment guide provides a production-ready AWS infrastructure for NexaCred Enhanced with high availability, security, and monitoring capabilities.
