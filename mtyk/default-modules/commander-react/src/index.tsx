import React, { useState, useEffect } from 'react';
// import { useEntities, createEntity } from 'modules/entities';
import  {Command } from 'modules/commander'

const GlobalCommander = () => {
  // const [query, setQuery] = useState('');
  // const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  // const commands = useEntities(Command);

  // const filteredCommands = commands.filter((command) =>
  //   command.isAvailable(query)
  // );

  // useEffect(() => {
  //   // Initialize available commands
  //   createEntity(Command, {
  //     title: 'Example Command',
  //     icon: 'example-icon',
  //     filter: (query) => query.includes('example'),
  //     action: () => console.log('Example command executed'),
  //   });

  //   // Add more commands as needed
  // }, []);

  // const handleKeyDown = (e) => {
  //   if (e.key === 'ArrowUp') {
  //     setSelectedCommandIndex((prevIndex) =>
  //       prevIndex === 0 ? filteredCommands.length - 1 : prevIndex - 1
  //     );
  //   } else if (e.key === 'ArrowDown') {
  //     setSelectedCommandIndex((prevIndex) =>
  //       prevIndex === filteredCommands.length - 1 ? 0 : prevIndex + 1
  //     );
  //   } else if (e.key === 'Enter') {
  //     filteredCommands[selectedCommandIndex].runCommand();
  //   }
  // };

  // return (
  //   <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex flex-col items-center justify-center">
  //     <input
  //       type="text"
  //       className="w-1/2 p-2 text-lg"
  //       value={query}
  //       onChange={(e) => setQuery(e.target.value)}
  //       onKeyDown={handleKeyDown}
  //     />
  //     <ul className="list-none m-0 p-0 max-h-48 overflow-y-auto">
  //       {filteredCommands.map((command, index) => (
  //         <li
  //           key={command.id}
  //           className={`p-2 cursor-pointer ${
  //             index === selectedCommandIndex ? 'bg-gray-400' : ''
  //           }`}
  //         >
  //           <i className={`mr-2 ${command.icon}`}></i>
  //           {command.title}
  //         </li>
  //       ))}
  //     </ul>
  //   </div>
  // );
};

export default GlobalCommander;
