import { cloneDeep as clone } from 'lodash';
import toposort from 'toposort';
import { ChatEntity } from "../entities/ChatEntity";
import parseCommand from "../input-syntax/parseCommand";
import runCommand from "../input-syntax/runCommand";
import { Attachment } from "./Attachment";

type AttachmentExecutionContext = {
  results: {
    [id: string]: any;
  };
  attachments: Attachment[];
};

export function createAttachmentExecutionContext(): AttachmentExecutionContext {
  return {
    attachments: [],
    results: {},
  };
}

async function getAttachmentValueInner(
  chat: ChatEntity,
  attachment: Attachment,
  ctx: AttachmentExecutionContext
) {
  if ('query' in attachment.data) {
    const queryValue = attachment.data.query;
    if (ctx.results.hasOwnProperty(attachment.id) && !attachment.dirty) {
      return ctx.results[attachment.id]; // Result exists in the compute graph, return it
    }

    const command = await parseCommand(queryValue, ctx);
    const result = await runCommand(chat, command);
    ctx.results[attachment.id] = result; // Store the result in the compute graph

    attachment.dirty = false; // Reset the dirty flag
    attachment.value = result; // Store the result in the attachment itself
    attachment.updatedAt = new Date()

    return result;
  }

  return undefined;
}

function iterateAttachments(attachments: Attachment[], cb: (attachment: Attachment) => void) {
  for (const attachment of attachments) {
    if (attachment.type === 'query') {
      cb(attachment);
    } else if (attachment.type === 'stacked') {
      cb(attachment);
      iterateAttachments(attachment.data.attachments, cb);
    }
  }
}

function mapAttachments<T>(attachments: Attachment[], cb: (attachment: Attachment) => T): T[] {
  const results: T[] = [];
  for (const attachment of attachments) {
    if (attachment.type === 'query') {
      results.push(cb(attachment));
    } else if (attachment.type === 'stacked') {
      results.push(cb(attachment), ...mapAttachments(attachment.data.attachments, cb));
    }
  }
  return results;
}

function findDependentAttachments(
  attachmentId: string,
  attachments: Attachment[]
): [string, string][] {
  const edges: [string, string][] = [];

  iterateAttachments(attachments, (attachment) => {
    if ('query' in attachment.data && attachment.data.query.includes(`$${attachmentId}`)) {
      edges.push([attachmentId, attachment.id]);  // attachment depends on dependent attachment
      attachment.dirty = true; // Mark dependent attachment as dirty
    }
  })

  return edges;
}

let recomputing: { [key: string]: boolean } = {}
export default async function recomputeDirtyAttachments(chat, newAttachments: Attachment[]) {
  if (recomputing[chat.id]) {
    return
  }

  try {
    recomputing[chat.id] = true
    const attachments = clone(newAttachments.slice());
    const ctx = { ...createAttachmentExecutionContext(), attachments };
    const dirtyAttachments = mapAttachments(attachments, attachment => attachment.dirty ? attachment : undefined).filter(Boolean) as Attachment[];
    const edges = dirtyAttachments.flatMap(attachment => findDependentAttachments(attachment.id, attachments));

    // Topologically sort the attachments
    const sortedAttachmentIds = toposort(edges);
    for (const id of dirtyAttachments.map(a => a.id)) {
      if (!sortedAttachmentIds.includes(id)) {
        // No edges existed for these, but they're still dirty
        sortedAttachmentIds.push(id);
      }
    }

    // Execute the attachments in the sorted order
    for (const id of sortedAttachmentIds) {
      const attachment = mapAttachments(attachments, attachment => attachment.id === id ? attachment : undefined).filter(Boolean)[0];
      if (attachment?.dirty && !attachment.locked) {
        const result = await getAttachmentValueInner(chat, attachment, ctx);
        console.log({ result })
      }
    }

    recomputing[chat.id] = false
    return { ctx, attachments };
  } catch (e) {
    recomputing[chat.id] = false
    throw e
  } finally {
    recomputing[chat.id] = false
  }
}
