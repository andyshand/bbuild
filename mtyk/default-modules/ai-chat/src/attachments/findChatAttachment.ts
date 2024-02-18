import { Attachment } from "./Attachment";

export default function findAttachment(attachments: Attachment[], id: string): Attachment | null {
  function searchAttachments(attachments: Attachment[]) {
    for (const attachment of attachments) {
      if (attachment.id === id) {
        return attachment;
      }
      if (attachment.type === 'stacked') {
        const subAttachment = searchAttachments(attachment.data.attachments);
        if (subAttachment) {
          return subAttachment;
        }
      }
    }
    return null;
  }

  return searchAttachments(attachments);
}
