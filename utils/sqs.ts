import { Duration, Stack } from "aws-cdk-lib";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { IQueue, Queue } from "aws-cdk-lib/aws-sqs";

enum QueueCategory {
  SQS = "SQS",
  DLQ = "DLQ",
}

interface QueueProps {
  visibilityTimeout: Duration;
  maxReceiveCount: number;
}

export interface SqsEventSourceProps {
  batchSize: number;
  maxBatchingWindow: Duration;
  reportBatchItemFailures: boolean;
}

function createDLQQueue(
  deploymentStack: Stack,
  queueName: string,
  stageName: string
): Queue {
  return new Queue(
    deploymentStack,
    `${queueName}-${QueueCategory.DLQ}-Queue-${stageName}`,
    {
      queueName: `${queueName}-${QueueCategory.DLQ}-Queue-${stageName}`,
    }
  );
}

export function createQueueWithDLQ(
  deploymentStack: Stack,
  queueName: string,
  stageName: string,
  queueConfig: QueueProps
): { queue: Queue; dlqQueue: Queue } {
  const dlqQueue = createDLQQueue(deploymentStack, queueName, stageName);
  const queue = new Queue(
    deploymentStack,
    `${queueName}-${QueueCategory.SQS}-Queue-${stageName}`,
    {
      queueName: `${queueName}-${QueueCategory.SQS}-Queue-${stageName}`,
      visibilityTimeout: queueConfig.visibilityTimeout,
      deadLetterQueue: {
        queue: dlqQueue,
        maxReceiveCount: queueConfig.maxReceiveCount,
      },
    }
  );

  return { queue, dlqQueue };
}

export function createSQSEventSource(
  queue: IQueue,
  props: SqsEventSourceProps
): SqsEventSource {
  return new SqsEventSource(queue, props);
}
