# RabbitMQ Queue Declaration Mismatch Fix

## Problem Summary

The error `PRECONDITION_FAILED - inequivalent arg 'x-message-ttl' for queue 'ASSIGNMENT_ATTEMPT_SUBMIT'` occurs because:

1. The queue `ASSIGNMENT_ATTEMPT_SUBMIT` was previously created with `x-message-ttl=30000` (30 seconds)
2. The current Node.js consumer tries to declare it without TTL arguments
3. RabbitMQ prevents redeclaring queues with incompatible arguments

## Root Cause Analysis

- **Python AI Service** (`radikari-ai/src/mq_handler.py`) previously declared queues with TTL
- **Node.js Backend** (`radikari-lms-backend/src/pkg/pubsub/index.ts`) declares queues without TTL
- **RabbitMQ Server** still has the old queue configuration with TTL

## Solution Options

### ✅ Solution 1: Automatic Queue Recovery (Recommended)

**Implemented in**: 
- `radikari-lms-backend/src/pkg/pubsub/index.ts`
- `radikari-ai/src/mq_handler.py`

This solution automatically detects the mismatch in **both services** and fixes it by:
1. Catching the `PRECONDITION_FAILED` error
2. Deleting the existing queue with incompatible configuration
3. Recreating the queue with the correct configuration
4. Continuing normal operation

### 🔧 Solution 2: Manual Queue Deletion

**Steps**:
1. Connect to RabbitMQ Management UI
2. Navigate to Queues tab
3. Delete the `ASSIGNMENT_ATTEMPT_SUBMIT` queue
4. Restart the Node.js consumer

**Pros**:
- Simple and direct
- No code changes needed

**Cons**:
- Manual intervention required
- Causes message loss
- Not scalable for multiple environments

### 🛠️ Solution 3: Explicit TTL Configuration

Modify the Node.js consumer to explicitly set TTL:

```typescript
await this.channel.assertQueue(queue, {
    durable: true,
    arguments: {
        'x-message-ttl': 30000  // Match existing configuration
    }
});
```

**Pros**:
- Maintains compatibility
- No message loss

**Cons**:
- May not be desired behavior (TTL might be unnecessary)
- Doesn't solve the underlying configuration inconsistency

### 🔄 Solution 4: Environment-Specific Queue Names

Use different queue names for different environments:

```typescript
const queueName = `${queue}_${process.env.NODE_ENV || 'development'}`;
```

**Pros**:
- Prevents conflicts between environments
- Clean separation

**Cons**:
- Requires changes throughout the system
- More complex configuration

## Implementation Status

✅ **Solution 1 has been implemented in both services**:
- **Node.js Consumer**: `src/pkg/pubsub/index.ts` now includes a `try...catch` block to handle the `PRECONDITION_FAILED` error, delete the old queue, and recreate it.
- **Python AI Service**: `radikari-ai/src/mq_handler.py` now uses a `_declare_queue_with_recovery` method to perform the same self-healing logic.

This dual implementation ensures that whichever service starts first, it will correct the queue configuration, making the system robust to startup order.

## Testing the Fix

1. Start the Node.js consumer service
2. Check the logs for the queue declaration process
3. Verify the consumer successfully connects and processes messages
4. Start the Python AI service and verify it also connects without errors.

## Monitoring

After applying the fix, monitor:
- Consumer startup logs for both services
- Queue creation in RabbitMQ Management UI
- Message processing continues normally

## Prevention

To prevent similar issues in the future:

1. **Document queue configurations** in a shared location
2. **Use infrastructure-as-code** for RabbitMQ setup (as done with the `init-queues.sh` script)
3. **Coordinate service deployments** to ensure compatible versions
4. **Add integration tests** for queue declarations

## Alternative Approaches

If Solution 1 doesn't work or causes issues, consider:

1. **RabbitMQ Policy-based Configuration**: Use policies instead of queue arguments
2. **Service Discovery**: Implement a configuration service that manages queue settings
3. **Feature Flags**: Use feature flags to control queue behavior during transitions

## Support

For additional assistance:
1. Check RabbitMQ logs for detailed error information
2. Verify network connectivity to RabbitMQ server
3. Ensure proper permissions for queue operations
4. Review environment configurations for both services