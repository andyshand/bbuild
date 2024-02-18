import React from "react";
import styled from "@emotion/styled";

type CardProps = {
  title: string;
  content: string;
};

const StyledCard = styled.div`
  background-color: #fff;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  border-radius: 5px;
  padding: 15px;
  margin: 10px 0;
`;

const StyledTitle = styled.h3`
  font-size: 18px;
  margin-bottom: 10px;
`;

const StyledContent = styled.p`
  font-size: 14px;
`;

export const Card: React.FC<CardProps> = ({ title, content }) => (
  <StyledCard>
    <StyledTitle>{title}</StyledTitle>
    <StyledContent>{content}</StyledContent>
  </StyledCard>
);
