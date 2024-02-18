import React from "react";
import styled from "@emotion/styled";

type TableData = {
  header: string[];
  rows: string[][];
};

type TableProps = {
  data: TableData;
};

const StyledTable = styled.table`
  border-collapse: collapse;
  width: 100%;
`;

const StyledHeader = styled.th`
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
  background-color: #f2f2f2;
`;

const StyledCell = styled.td`
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
`;

export const CommandPromptTable: React.FC<TableProps> = ({ data }) => (
  <StyledTable>
    <thead>
      <tr>
        {data.header.map((header, index) => (
          <StyledHeader key={index}>{header}</StyledHeader>
        ))}
      </tr>
    </thead>
    <tbody>
      {data.rows.map((row, rowIndex) => (
        <tr key={rowIndex}>
          {row.map((cell, cellIndex) => (
            <StyledCell key={cellIndex}>{cell}</StyledCell>
          ))}
        </tr>
      ))}
    </tbody>
  </StyledTable>
);

export default CommandPromptTable;
