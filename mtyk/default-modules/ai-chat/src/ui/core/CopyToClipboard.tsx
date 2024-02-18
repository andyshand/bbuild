import React from 'react';
import { FaClipboard } from 'react-icons/fa';

interface CopyToClipboardButtonProps {
  textToCopy: string;
  buttonText: string;
  buttonClassName?: string;
  buttonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}

interface CopyToClipboardButtonState {
  copied: boolean;
}

class CopyToClipboardButton extends React.Component<
  CopyToClipboardButtonProps,
  CopyToClipboardButtonState
> {
  constructor(props: CopyToClipboardButtonProps) {
    super(props);
    this.state = {
      copied: false,
    };
  }

  copyToClipboard = () => {
    navigator.clipboard.writeText(this.props.textToCopy);
    this.setState({ copied: true });
    setTimeout(() => {
      this.setState({ copied: false });
    }, 1500);
  };

  render() {
    const { buttonText, buttonClassName, buttonProps } = this.props;
    const { copied } = this.state;

    return (
      <button
        className={`text-xs flex items-center justify-center px-4 border border-transparent
           font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${buttonClassName}`}
        onClick={this.copyToClipboard}
        {...buttonProps}
      >
        {copied ? (
          <>
            <span className="mr-2">Copied</span>
            <input type="checkbox" checked readOnly />
          </>
        ) : (
          <>
            <FaClipboard className="w-5 h-5 mr-2" />
            {buttonText}
          </>
        )}
      </button>
    );
  }
}

export default CopyToClipboardButton;
