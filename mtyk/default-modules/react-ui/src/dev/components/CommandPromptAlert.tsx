import React from "react";
import { css } from "@emotion/react";
import styled from "@emotion/styled";

type AlertProps = {
  type: "success" | "info" | "warning" | "error";
  children: string;
};

const StyledAlert = styled.div<AlertProps>`
  padding: 15px;
  border-radius: 5px;
  font-size: 14px;
  margin: 10px 0;

  ${(props) => {
    switch (props.type) {
      case "success":
        return css`
          background-color: #dff0d8;
          color: #3c763d;
          border: 1px solid #3c763d;
        `;
      case "info":
        return css`
          background-color: #d9edf7;
          color: #31708f;
          border: 1px solid #31708f;
        `;
      case "warning":
        return css`
          background-color: #fcf8e3;
          color: #8a6d3b;
          border: 1px solid #8a6d3b;
        `;
      case "error":
        return css`
          background-color: #f2dede;
          color: #a94442;
          border: 1px solid #a94442;
        `;
    }
  }}
`;

export const Alert: React.FC<AlertProps> = ({ type, children }) => <StyledAlert type={type}>{children}</StyledAlert>;
