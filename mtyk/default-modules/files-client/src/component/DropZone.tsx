import { ChangeEvent, DragEvent, ReactNode, useCallback, useState, useRef } from "react";

export type DropZoneEvent = DragEvent<HTMLDivElement>
export type FilePickerEvent = ChangeEvent<HTMLInputElement>

export interface DropzoneProps {
    className?: string | undefined;
    children?: ReactNode | undefined | Array<ReactNode>;
    onFilesReceived?: (files: File[]) => void;
    onDragStateChanged?: (state: DragState, files?: File[]) => void; // Modified handler for 'onDragStateChanged' to include file info
}

export enum DragState {
    IDLE, DRAG_START, FILE_DRAG_START, FILE_RECEIVE
}

const fileListToArray = (list: FileList) => {
    var files = []
    for (let index = 0; index < list.length; index++) {
        const file = list.item(index);
        if (file) files.push(file)
    }
    return files
}

const Dropzone = ({ className, children, onFilesReceived, onDragStateChanged, ...rest }: DropzoneProps) => {
    const [dragState, setDragState] = useState<DragState>(DragState.IDLE);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const overEventHandler = useCallback((event: DropZoneEvent) => {
        var newState
        var files: File[] | undefined
        if (event.type === 'dragover') {
            if (event.dataTransfer.dropEffect === 'copy') {
                newState = DragState.FILE_DRAG_START
            } else {
                newState = DragState.DRAG_START
            }
        } else if (event.type === 'drop') {
            if (dragState === DragState.FILE_DRAG_START) {
                console.log(event.dataTransfer.files)
                files = fileListToArray(event.dataTransfer.files)

                newState = DragState.FILE_RECEIVE
                if (files.length > 0 && onFilesReceived) {
                    onFilesReceived(files)
                }
            } else {
                newState = DragState.IDLE
            }
        } else if (event.type === 'dragleave') {
            newState = DragState.IDLE
        }

        if (newState !== undefined) {
            setDragState(newState)
            if (onDragStateChanged) onDragStateChanged(newState, files) // Modified call to include file info
        }
        event.preventDefault()
    }, [dragState, onDragStateChanged]) // Added onDragStateChanged to the dependency array

    const onFilePicked = useCallback((event: FilePickerEvent) => {
        const list = event.target.files
        if (list) {
            const files = fileListToArray(list)

            setDragState(DragState.FILE_RECEIVE)
            if (files.length > 0 && onFilesReceived) onFilesReceived(files)
        }
    }, [])

    const handleDivClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div
            className={className}
            onClick={handleDivClick} // Add the onClick handler here
            onDragStart={overEventHandler}
            onDragOver={overEventHandler}
            onDrop={overEventHandler}
            onDragCapture={overEventHandler}
            onDragLeave={overEventHandler}
            {...rest}>
            {children}
            <input
                ref={fileInputRef}
                style={{ display: 'none' }}
                type="file"
                id="dropzone-file-picker"
                onChange={onFilePicked}
            />
        </div>
    )
}

export default Dropzone