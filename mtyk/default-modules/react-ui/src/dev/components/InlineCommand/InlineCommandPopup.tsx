import React, { useState, useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import { AiOutlineSearch } from 'react-icons/ai';
import { keyframes } from '@emotion/react';

const InlineCommandPopupWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const Input = styled.input`
  width: 100%;
  padding: 6px 8px;
  font-size: 12px;
  border: none;
  outline: none;
  border-radius: 12px;
  transition: background-color 0.2s, padding 0.2s;
  &:focus {
    background-color: #f0f0f0;
    padding: 8px;
  }
`;

const List = styled.ul`
  position: absolute;
  background-color: white;
  width: 100%;
  list-style-type: none;
  margin: 0;
  padding: 0;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  max-height: 200px;
  z-index: 1;
`;

const ListItem = styled.li<{ isSelected: boolean }>`
  display: flex;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  font-size: 12px;
  background-color: ${({ isSelected }) => (isSelected ? '#ccc' : 'white')};
`;

const OptionIcon = styled.span`
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 8px;
`;

const SearchIcon = styled(AiOutlineSearch)`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
`;

const spinnerAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoadingSpinner = styled.div`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  &:before {
    content: '';
    box-sizing: border-box;
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid #ccc;
    border-top-color: #333;
    animation: ${spinnerAnimation} 1s infinite linear;
  }
`;

export type InlineCommandPopupProps = {
  options: Array<{
    label: string;
    icon: React.ReactNode;
    action: () => Promise<void>;
  }>;
};

const InlineCommandPopup: React.FC<InlineCommandPopupProps> = ({ options }) => {
  const [query, setQuery] = useState('');
  const [selectedOption, setSelectedOption] = useState(0);
  const [isListVisible, setIsListVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filteredOptions = options
    .filter((option) => option.label.toLowerCase().indexOf(query.toLowerCase()) > -1)
    .slice(0, 10);

  useEffect(() => {
    if (listRef.current) {
      const selectedItem = listRef.current.children[
        selectedOption
      ] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedOption]);

  const handleKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp') {
      setSelectedOption((prevSelected) => Math.max(prevSelected - 1, 0));
    } else if (event.key === 'ArrowDown') {
      setSelectedOption((prevSelected) =>
        Math.min(prevSelected + 1, filteredOptions.length - 1)
      );
    } else if (event.key === 'Enter') {
      if (filteredOptions[selectedOption]) {
        setIsLoading(true);
        await filteredOptions[selectedOption].action();
        setIsLoading(false);
        setIsListVisible(false);
        setQuery('');
      }
    }
  };

  const handleFocus = () => {
    setIsListVisible(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsListVisible(false);
      setQuery('');
    }, 200);
  };

  return (
    <InlineCommandPopupWrapper>
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoComplete="off"
        spellCheck={false}
        placeholder="Search actions..."
      />
      <SearchIcon />
      {isLoading && <LoadingSpinner />}
      {isListVisible && (
        <List ref={listRef}>
          {filteredOptions.map((option, index) => (
            <ListItem
              key={index}
              isSelected={index === selectedOption}
              onClick={async () => {
                setIsLoading(true);
                await option.action();
                setIsLoading(false);
                setIsListVisible(false);
                setQuery('');
              }}
            >
              <OptionIcon>{option.icon}</OptionIcon>
              {option.label}
            </ListItem>
          ))}
        </List>
      )}
    </InlineCommandPopupWrapper>
  );
};

export default InlineCommandPopup;
