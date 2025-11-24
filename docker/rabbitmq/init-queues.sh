#!/bin/bash
set -e

# RabbitMQ Queue Initialization Script
# This script runs on RabbitMQ startup to ensure clean queue configuration

echo "🐰 Initializing RabbitMQ queues..."

# Wait for RabbitMQ to be fully ready
rabbitmqctl wait /var/lib/rabbitmq/mnesia/rabbitmq@$HOSTNAME.pid

# Function to clean up queues with incompatible TTL configuration
cleanup_queues_with_ttl() {
    echo "🧹 Checking for queues with incompatible TTL configuration..."
    
    # List all queues and check for ASSIGNMENT_ATTEMPT_SUBMIT with TTL
    rabbitmqctl list_queues name arguments | grep -E "ASSIGNMENT_ATTEMPT_SUBMIT.*x-message-ttl" && {
        echo "🔧 Found ASSIGNMENT_ATTEMPT_SUBMIT queue with TTL configuration. Cleaning up..."
        
        # Force delete the problematic queue
        rabbitmqctl delete_queue ASSIGNMENT_ATTEMPT_SUBMIT || true
        echo "✅ Cleaned up ASSIGNMENT_ATTEMPT_SUBMIT queue"
    }
    
    # Also clean up other queues that might have TTL issues
    for queue in "KNOWLEDGE_CREATE" "KNOWLEDGE_UPDATE" "KNOWLEDGE_DELETE"; do
        rabbitmqctl list_queues name arguments | grep -E "${queue}.*x-message-ttl" && {
            echo "🔧 Found ${queue} queue with TTL configuration. Cleaning up..."
            rabbitmqctl delete_queue "${queue}" || true
            echo "✅ Cleaned up ${queue} queue"
        }
    done
}

# Function to create policies for consistent queue management
create_queue_policies() {
    echo "📋 Creating queue management policies..."
    
    # Policy to ensure no TTL is applied to assignment queues
    rabbitmqctl set_policy \
        --apply-to queues \
        assignment-queues-no-ttl \
        "^(ASSIGNMENT_ATTEMPT_SUBMIT|KNOWLEDGE_CREATE|KNOWLEDGE_UPDATE|KNOWLEDGE_DELETE)$" \
        '{"message-ttl": null}' \
        --priority 1 || true
    
    echo "✅ Created queue policies for consistent configuration"
}

# Execute cleanup and setup
cleanup_queues_with_ttl
create_queue_policies

echo "🎉 RabbitMQ queue initialization completed successfully!"