// import * as Babel from '@babel/core'

// export async function renameJsxElements(sourceCode: string): Promise<string> {
//   const { code } = await Babel.transformAsync(sourceCode, {
//     plugins: [
//       '@babel/plugin-syntax-jsx',
//       {
//         visitor: {
//           JSXIdentifier(path) {
//             // path.node.name = path.node.name.slice(0, 1)

//             // remove attributes

//             if (path.node.openingElement)
//               path.node.openingElement.attributes = []

//             // path.node.name = renamer(path.node.name)
//           },
//         },
//       },
//     ],
//   })

//   // remove all whitespace
//   return code.replaceAll(/\s/g, '')
// }

// renameJsxElements(`<div className="page" data-testid="department-dashboard">
// <HeaderIngame turns={turns} />
// <Modal show={showModal}>
//     <Modal.Header>
//         <Modal.Title>{t\`endGame.title\`}</Modal.Title>
//     </Modal.Header>
//     <Modal.Body>{t\`endGame.body\`}</Modal.Body>
//     <Modal.Footer>
//         <Button variant="primary" onClick={endGame}>
//             {t\`endGame.exitButton\`}
//         </Button>
//     </Modal.Footer>
// </Modal>
// <section className="section static">
//     <div className="container">
//         <div className="dp-dash__header" />
//         <Tabs
//             mountOnEnter
//             unmountOnExit
//             transition={false}
//             id="profile-tabs"
//             className="nav dp-dash__header-nav"
//             activeKey={currentTab}
//             onSelect={(currentTab) => {
//                 setCurrentTab(currentTab);
//             }}
//         >
//             <Tab
//                 eventKey={1}
//                 tabClassName="nav-item"
//                 title={
//                     <>
//                         <i className="far fa-clipboard-list-check"></i>
//                         <span>{t\`dashboard.tabs.department.name\`} </span>
//                         <Badge variant="primary" bsPrefix="dp-qt">
//                             {patientData.length}
//                         </Badge>
//                     </>
//                 }
//             >
//                 <div className="dp-dash__body">
//                     <div className="dp-dash__list-header">
//                         <h4>{t\`dashboard.tabs.department.title\`}</h4>
//                     </div>

//                     <PatientTable
//                         patients={patientData}
//                         patientList={patientList}
//                         onPatientChange={loadPatients}
//                     />
//                 </div>
//             </Tab>

//             <Tab
//                 eventKey={2}
//                 tabClassName="nav-item"
//                 title={
//                     <>
//                         <i className="far fa-lock"></i>
//                         <span> {t\`dashboard.tabs.discharged.name\`} </span>
//                         <Badge variant="primary" bsPrefix="dp-qt">
//                             {dischargedPatientData.length}
//                         </Badge>
//                     </>
//                 }
//             >
//                 <div className="dp-dash__body">
//                     <div className="dp-dash__list-header">
//                         <h4>{t\`dashboard.tabs.discharged.title\`}</h4>
//                     </div>

//                     <DischargedPatientTable
//                         patients={dischargedPatientData}
//                         onPatientChange={loadPatients}
//                     />
//                 </div>
//             </Tab>
//             {isDesktop ? (
//                 <Tab
//                     eventKey={3}
//                     tabClassName="nav-item"
//                     title={
//                         <>
//                             <i className="far fa-eye"></i>
//                             <span> Emergency Room </span>
//                         </>
//                     }
//                 >
//                     <div className="dp-dash__body emergency-room">
//                         <EmergencyRoom
//                             patientData={patientData}
//                             onPatientChange={loadPatientList}
//                         />
//                     </div>
//                 </Tab>
//             ) : null}
//         </Tabs>
//     </div>
//     <HelpFloater />
// </section>
// </div>`).then(console.log)

export default null
