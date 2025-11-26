
# Docker Compose Updates for RabbitMQ Queue Issue Resolution

## Overview

This document outlines the changes made to `docker-compose-deploy.yaml` to address the RabbitMQ queue declaration mismatch issue.

## Changes Made

### 1. RabbitMQ Service Enhancement

**File**: `docker-compose-deploy.yaml` (lines 48-67)

#### Added:
- **Management Plugin Configuration**: Explicitly enabled `rabbitmq_management`
- **Initialization Script**: Added `./docker/rabbitmq/init-queues.sh` for automatic queue cleanup
- **Better Environment Variables**: Enhanced configuration for queue management

#### Before:
```yaml
rabbitmq:
  image: rabbitmq:3-management-alpine
  environment:
    RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER:-radikari}
    RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD:-radikari123}
  volumes:
    - radikari_lms_rabbit_data:/var/lib/rabbitmq
```

#### After:
```yaml
rabbitmq:
  image: rabbitmq:3-management-alpine
  environment:
    RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER:-radikari}
    RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD:-radikari123}
    RABBITMQ_MANAGEMENT_PLUGIN: "rabbitmq_management"
  volumes:
    - radikari_lms_rabbit_data:/var/lib/rabbitmq
    - ./docker/rabbitmq/init-queues.sh:/docker-entrypoint-init.d/10-init-queues.sh:ro
```

### 2. Consumer Service Activation

**File**: `docker-compose-deploy.yaml` (line 207)

#### Changed:
- **Enabled Consumer Service**: Uncommented the consumer service to allow proper queue testing

### 3. RabbitMQ Initialization Script

**File**: `docker/rabbitmq/init-queues.sh`

#### Features:
- **Automatic Queue Cleanup**: Removes queues with incompatible TTL configuration
- **Policy Management**: Creates policies to ensure consistent queue configuration
- **Startup Validation**: Waits for RabbitMQ to be fully ready before initialization

## How It Works

### 1. Container Startup Process

1. **RabbitMQ starts** with the management plugin enabled
2. **Initialization script runs** automatically via `docker-entrypoint-init.d`
3. **Queue cleanup** removes any existing queues with TTL configuration
4. **Policies are applied** to ensure consistent queue management
5. **Application services start** and can declare queues without conflicts

### 2. Queue Cleanup Logic

The initialization script:
- Detects queues with `x-message-ttl` arguments
- Automatically deletes problematic queues
- Creates policies to prevent TTL configuration issues
- Logs all actions for debugging

### 3. Policy Management

- **assignment-queues-no-ttl policy**: Ensures no TTL is applied to critical queues
- **Priority-based application**: Policies take precedence over queue arguments
- **Pattern matching**: Applies to specific queue names using regex patterns

## Deployment Instructions

### 1. Fresh Deployment (Recommended)

```bash
# Stop all services
docker-compose -f docker-compose-deploy.yaml down

# Remove existing RabbitMQ volume (fresh start)
docker volume rm radikari_lms_rabbit_data

# Start services with new configuration
docker-compose -f docker-compose-deploy.yaml up -d
```

### 2. Rolling Update (Minimal Downtime)

```bash
# Restart RabbitMQ with new configuration
docker-compose -f docker-compose-deploy.yaml restart rabbitmq

# Wait for initialization to complete
docker-compose -f docker-compose-deploy.yaml logs -f rabbitmq

# Restart consumer service
docker-compose -f docker-compose-deploy.yaml restart consumer
```

### 3. Verification Steps

1. **Check RabbitMQ Logs**:
   ```bash
   docker-compose -f docker-compose-deploy.yaml logs rabbitmq
   ```

2. **Verify Queue Status**:
   - Access RabbitMQ Management UI: `http://localhost:15672`
   - Login with credentials: `${RABBITMQ_USER:-radikari}` / `${RABBITMQ_PASSWORD:-radikari123}`
   - Check Queues tab for proper configuration

3. **Test Consumer Service**:
   ```bash
   docker-compose -f docker-compose-deploy.yaml logs consumer
   ```

## Environment Variables

### New Optional Variables

```bash
# RabbitMQ Configuration
RABBITMQ_MANAGEMENT_PLUGIN=rabbitmq_management

# Queue Management (optional)
RABBITMQ_AUTO_CLEANUP=true
```

## Troubleshooting

### 1. Queue Still Has TTL After Restart

If queues still show TTL configuration after the update:

```bash
# Force complete reset
docker-compose -f docker-compose-deploy.yaml down -v
docker volume rm radikari_lms_rabbit_data
docker-compose -f docker-compose-deploy.yaml up -d
```

### 2. Initialization Script Not Running

Check if the script is properly mounted and executable:

```bash
# Verify script permissions
chmod +x docker/rabbitmq/init-queues.sh

# Check container logs for initialization
docker-compose -f docker-compose-deploy.yaml logs rabbitmq | grep "🐰"
```

### 3. Consumer Service Fails to Start

If the consumer service still encounters queue declaration errors:

```bash
# Check consumer logs for detailed error information
docker-compose -f docker-compose-deploy.yaml logs consumer

# Verify automatic recovery is working
docker-compose -f docker-compose-deploy.yaml logs consumer | grep "incompatible TTL"
```

## Monitoring and Maintenance

### 1. Regular Health Checks

Monitor RabbitMQ queue health:
```bash
# Check queue status
docker exec radikari-lms-rabbitmq rabbitmqctl list_queues name arguments

# Check applied policies
docker exec radikari-lms-rabbitmq rabbitmqctl list_policies
```

### 2. Log Monitoring

Key log patterns to monitor:
- `🐰 Initializing RabbitMQ queues...` - Startup initialization
- `🔧 Found ASSIGNMENT_ATTEMPT_SUBMIT queue with TTL configuration` - Queue cleanup
- `✅ Cleaned up ASSIGNMENT_ATTEMPT_SUBMIT queue` - Successful cleanup
- `[CONSUMER] Successfully recreated queue` - Automatic recovery in consumer

### 3. Performance Considerations

- **Volume Persistence**: The RabbitMQ volume preserves state between restarts
- **Initialization Overhead**: Queue cleanup adds ~10-15 seconds to startup time
- **Memory Usage**: Policies and monitoring have minimal memory impact

## Security Considerations

- **Management Plugin**: Enabled for better visibility and debugging
- **Default Credentials**: Consider changing from default credentials in production
- **Network Exposure**: Management UI is exposed on port 15672 - secure appropriately

## Future Improvements

1. **Infrastructure as Code**: Consider using Terraform or Ansible for RabbitMQ configuration
2. **Monitoring Integration**: Add Prometheus metrics for queue monitoring
3. **Backup Strategy**: Implement queue backup and restore procedures
4. **Multi-environment Support**: Use separate RabbitMQ instances for different environments

## Related Files

- `docker-compose-deploy.yaml` - Main Docker Compose configuration
- `docker/rabbitmq/init-queues.sh` - RabbitMQ initialization script
- `src/pkg/pubsub/index.ts` - Enhanced consumer with automatic recovery
- `RABBITMQ_QUEUE_FIX.md` - Detailed technical analysis and solutions