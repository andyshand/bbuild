// import { StateMachineTransitions } from 'modules/machine2/StateMachineTransitions'

// class EntityModel {update(data) {}}
// class MessageModel {update(data){}}
// // Define the argument types for the message composer state machine
// type MessageComposerArgs = {
//   message?: string;
//   entity?: EntityModel;
//   context?: any;
// };

// // Define the state for the message composer state machine
// type MessageComposerState = {
//   messageModel: MessageModel;
//   entityRecognizer: any;
//   contextProvider: any;
// };

// // Define the global state for the message composer state machine
// type MessageComposerGlobalState = {
//   composerState: MessageComposerState;
// };

// const messageComposerTransitions: StateMachineTransitions<MessageComposerArgs, MessageComposerState, MessageComposerGlobalState> = {
//   // Initialize the state machine, set up the message model, entity recognizer, and context provider
//   start: async (args, utils) => {
//     const messageModel = new MessageModel();
//     const entityRecognizer = {}; // Initialize your entity recognizer
//     const contextProvider = {}; // Initialize your context provider

//     utils.state.composerState = {
//       messageModel,
//       entityRecognizer,
//       contextProvider,
//     };

//     // Transition to the composing state
//     return [
//       {
//         state: 'composing',
//         messageModel,
//         entityRecognizer,
//         contextProvider,
//       },
//     ];
//   },

//   // Handle the user typing a message and recognizing entities
//   composing: (args, utils) => {
//     const { message } = args;
//     const { entityRecognizer, messageModel } = utils.current;

//     if (!message) return [utils.current];

//     // Recognize entities within the user's message
//     const recognizedEntities = entityRecognizer.recognize(message);

//     // For each recognized entity, fetch context suggestions
//     recognizedEntities.forEach((entity: EntityModel) => {
//       utils.transition('fetchContext', { entity });
//     });

//     // Update the message model with the new message text
//     messageModel.update(message);

//     return [utils.current];
//   },

//   // Fetch context suggestions for a recognized entity
//   fetchContext: async (args, utils) => {
//     const { entity } = args;
//     const { contextProvider } = utils.current;

//     if (!entity) return [utils.current];

//     // Fetch context suggestions for the given entity
//     const contextSuggestions = await contextProvider.fetch(entity);

//     // If there's only one suggestion, automatically attach it to the entity
//     if (contextSuggestions.length === 1) {
//       entity.update({ context: contextSuggestions[0] });
//     } else {
//       // If there are multiple suggestions, show a context popup for the user to choose
//       utils.transition('showContextPopup', { entity, contextSuggestions });
//     }

//     return [utils.current];
//   },

//   // Show a context popup for the user to choose the appropriate context for an entity
//   showContextPopup: (args, utils) => {
//     const { entity, contextSuggestions } = args;
//     const contextPopup = new ContextPopup(contextSuggestions);

//     // When the user selects a context, update the entity with the chosen context and return to the composing state
//     contextPopup.onSelect((selectedContext: any) => {
//       entity.update({ context: selectedContext });
//       utils.transition('composing', { message: utils.state.composerState.messageModel.text });
//     });

//     // Return the current state and a cleanup function to dispose of the context popup when it's no longer needed
//     return [
//       utils.current,
//       () => {
//         contextPopup.dispose();
//       },
//     ];
//   },
// };