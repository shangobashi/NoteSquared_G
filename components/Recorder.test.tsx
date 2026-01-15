import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Recorder } from './Recorder';

// Fix for missing types
declare const jest: any;
declare const describe: any;
declare const test: any;
declare const expect: any;
declare const beforeEach: any;

// Mock MediaRecorder
const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  ondataavailable: jest.fn(),
  onstop: jest.fn(),
  mimeType: 'audio/webm',
  state: 'inactive'
};

// Mock navigator.mediaDevices
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }]
    })
  },
  writable: true
});

global.MediaRecorder = jest.fn(() => mockMediaRecorder) as any;
(global.MediaRecorder as any).isTypeSupported = jest.fn(() => true);

describe('Recorder Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  test('renders initial state', () => {
    render(<Recorder onRecordingComplete={jest.fn()} />);
    expect(screen.getByText('Tap the microphone to start recording the lesson.')).toBeInTheDocument();
  });

  test('starts recording when microphone clicked', async () => {
    render(<Recorder onRecordingComplete={jest.fn()} />);
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /start recording/i }));
    });

    expect(mockMediaRecorder.start).toHaveBeenCalled();
    expect(screen.getByText('Recording')).toBeInTheDocument();
  });

  test('stops recording and calls callback with correct duration', async () => {
    const onComplete = jest.fn();
    render(<Recorder onRecordingComplete={onComplete} />);

    // Start
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /start recording/i }));
    });

    // Advance time by 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Stop
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /stop recording/i }));
    });
    
    expect(mockMediaRecorder.stop).toHaveBeenCalled();

    // Manually trigger the onstop since the mock doesn't do it automatically
    act(() => {
      if (mockMediaRecorder.onstop) {
        mockMediaRecorder.onstop({} as any);
      }
    });

    expect(onComplete).toHaveBeenCalled();
    // The second argument is duration. It should be 3.
    expect(onComplete.mock.calls[0][1]).toBe(3);
  });
});