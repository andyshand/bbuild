import { keyframes } from '@emotion/react'
import styled from '@emotion/styled'

export const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  font-family: 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 16px;
  z-index: 10000;
`
export const BoxWrapper = styled.div`
  position: relative;
  background-color: white;
  width: 60em;
  max-height: 80vh;
  height: 40em;
  border-radius: 0.4em;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
`

export const List = styled.ul`
  width: 100%;
  list-style-type: none;
  margin: 0;
  padding: 0;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  flex-grow: 1;
`
export const ListItem = styled.li<{ isSelected: boolean }>`
  padding: 8px;
  cursor: pointer;
`
const spinnerAnimation = keyframes`
 0% { transform: rotate(0deg); }
 100% { transform: rotate(360deg); }
`
export const LoadingIndicator = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  &:before {
    content: '';
    box-sizing: border-box;
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid #ccc;
    border-top-color: #333;
    animation: ${spinnerAnimation} 1s infinite linear;
  }
`
export const CommandContainer = styled.div`
  width: 50%;
  display: flex;
  flex-direction: column;
`
export const FormContainer = styled.div`
  width: 50%;
  border-left: 1px solid #ccc;
  padding: 16px;
  display: flex;
  flex-direction: column;
`
export const ResultWrapper = styled.div`
  background-color: white;
  color: black;
  width: 100%;
`
