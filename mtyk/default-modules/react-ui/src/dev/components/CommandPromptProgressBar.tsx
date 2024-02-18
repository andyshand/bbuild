import React from "react";
import styled from "@emotion/styled";

type ProgressBarProps = {
  progress: number;
};

const StyledProgressBar = styled.div`
  width: 100%;
  background-color: #f3f3f3;
  border-radius: 5px;
`;

const StyledProgress = styled.div<ProgressBarProps>`
  height: 15px;
  width: ${(props) => props.progress}%;
  background-color: #4caf50;
  border-radius: 5px;
`;

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => (
  <StyledProgressBar>
    <StyledProgress progress={progress} />
  </StyledProgressBar>
);
