export type AttachmentBase = {
  id: string;
  label: string;
  transformQuery?: string;
  dirty?: boolean
  locked?: boolean
  updatedAt?: Date
  value?: any
}

export type FileAttachment = AttachmentBase & {
  type: "file";
  data: {
    content: string;
    path: string;
  };
};

export type ChatFileAttachment = AttachmentBase & {
  type: 'chat-file',
  data: FileAttachment['data'] & {
    chatId: string
  }
}

export type AnotherAttachment = AttachmentBase & {
  type: "another";
  data: {};
};

export type StackedAttachment = AttachmentBase & {
  type: 'stacked',
  data: {
    attachments: Attachment[]
    expanded?: boolean
  }
}

export type UsageAttachment = AttachmentBase & {
  type: 'usage',
  data: {
    query: string,
    usage: {
      file: string,
      usage: string
    }
  }
}

export type QueryAttachment = AttachmentBase & {
  type: 'query',
  data: {
    query: string
  }
}

export type Attachment = FileAttachment | AnotherAttachment | StackedAttachment | ChatFileAttachment | UsageAttachment | QueryAttachment;
