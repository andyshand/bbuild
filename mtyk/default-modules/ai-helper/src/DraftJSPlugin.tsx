
// import React, { Component } from 'react';
// import { Editor, EditorState, RichUtils, AtomicBlockUtils, ContentState, convertToRaw, convertFromRaw } from 'draft-js';

// class Dropdown extends Component<{
//   options: string[];
//   onSelect: (option: string) => void;
//   visible: boolean;
// }> {
//   render() {
//     const { options, onSelect, visible } = this.props;
//     if (!visible) return null;

//     return (
//       <ul className="dropdown">
//         {options.map((option, i) => (
//           <li key={i} onClick={() => onSelect(option)}>
//             {option}
//           </li>
//         ))}
//       </ul>
//     );
//   }
// }

// class CustomTextarea extends Component {
//   state = {
//     editorState: EditorState.createEmpty(),
//     options: ['Option1', 'Option2', 'Option3', 'Option4', 'Option5'],
//     dropdownVisible: false
//   };

//   onChange = (editorState) => {
//     this.setState({ editorState });
//   };

//   handleKeyCommand = (command, editorState) => {
//     if (command === '/') {
//       this.setState({ dropdownVisible: true });
//       return 'handled';
//     }
//     return 'not-handled';
//   };

//   handleReturn = () => {
//     if (this.state.dropdownVisible) {
//       this.setState({ dropdownVisible: false });
//       return 'handled';
//     }
//     return 'not-handled';
//   };

//   insertOption = (option) => {
//     const { editorState } = this.state;
//     const contentState = editorState.getCurrentContent();
//     const contentStateWithEntity = contentState.createEntity('CUSTOM_OPTION', 'IMMUTABLE', { option });
//     const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
//     const newEditorState = EditorState.set(editorState, { currentContent: contentStateWithEntity });
//     this.setState({
//       editorState: AtomicBlockUtils.insertAtomicBlock(newEditorState, entityKey, ' ')
//     });
//   };

//   blockRendererFn = (contentBlock) => {
//     const type = contentBlock.getType();
//     if (type === 'atomic') {
//       return {
//         component: CustomOption,
//         editable: false,
//         props: {
//           foo: 'bar'
//         }
//       };
//     }
//   };

//   render() {
//     return (
//       <div className="custom-textarea">
//         <Editor
//           editorState={this.state.editorState}
//           onChange={this.onChange}
//           handleKeyCommand={this.handleKeyCommand}
//           handleReturn={this.handleReturn}
//           blockRendererFn={this.blockRendererFn}
//           placeholder="Type here and press / for options..."
//         />
//         <Dropdown
//           options={this.state.options}
//           onSelect={this.insertOption}
//           visible={this.state.dropdownVisible}
//         />
//       </div>
//     );
//   }
// }

// class CustomOption extends Component {
//   render() {
//     const { contentState, block } = this.props;
//     const data = contentState.getEntity(block.getEntityAt(0)).getData();
//     return (
//       <span className="custom-option" contentEditable={false}>
//         [{data.option}]
//       </span>
//     );
//   }
// }

// export default CustomTextarea;


// // You also need to add the following CSS to style the dropdown menu and custom option:

// // ```css
// // /* CustomTextarea.css */

// // .custom-textarea {
// //   position: relative;
// // }

// // .dropdown {
// //   position: absolute;
// //   background-color: white;
// //   border: 1px solid #ccc;
// //   list-style: none;
// //   padding: 0;
// //   margin: 0;
// //   z-index: 1000;
// //   max-height: 200px;
// //   overflow-y: auto;
// //   box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
// // }

// // .dropdown li {
// //   padding: 8px;
// //   cursor: pointer;
// // }

// // .dropdown li:hover {
// //   background-color: #eee;
// // }

// // .custom-option {
// //   background-color: #e6e6e6;
// //   border-radius: 2px;
// //   padding: 2px 5px;
// //   margin-right: 5px;
// //   color: #333;
// //   display: inline-block;
// // }
// // ```

