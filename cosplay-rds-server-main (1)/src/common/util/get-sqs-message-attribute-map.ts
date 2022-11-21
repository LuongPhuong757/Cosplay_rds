import SQS from 'aws-sdk/clients/sqs';

export const getSqsMessageAttribute = (
  messageAttributes: SQS.MessageBodyAttributeMap,
): { objStr: { [key: string]: string }; objNum: { [key: string]: number } } => {
  const objStr: { [key: string]: string } = {};
  const objNum: { [key: string]: number } = {};

  for (const [key, value] of Object.entries(messageAttributes)) {
    const { DataType, StringValue } = value;
    if (!StringValue) {
      continue;
    }
    if (DataType === 'String') {
      objStr[key] = StringValue;
      continue;
    }
    objNum[key] = Number(StringValue);
  }

  return {
    objStr,
    objNum,
  };
};
