import React, { useState, useEffect } from "react";
import "./App.css";

const App = () => {
  const [port, setPort] = useState(null);
  const [writer, setWriter] = useState(null);
  const [text, setText] = useState("Hello World");
  const [error, setError] = useState(null);
  const [indicator, setIndicator] = useState(0);

  // Effect to automatically send text to the display when it changes
  useEffect(() => {
    if (!writer) return;

    const encoder = new TextEncoder();

    const sendData = async () => {
      try {
        // Use "ESC Q A" to write to the top line, followed by the text and a carriage return.
        await writer.write(encoder.encode("\x1bQA" + text + "\r"));
        console.log(`Sent "${text}" to display using ESC Q A.`);
      } catch (error) {
        console.error("Failed to write to display:", error);
        setError(`Error: ${error.message}`);
      }
    };

    // Debounce the input to avoid overwhelming the device
    const handler = setTimeout(() => {
      sendData();
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [text, writer]);

  // Effect to send indicator command when it changes
  useEffect(() => {
    if (!writer) return;

    const sendIndicatorCommand = async () => {
      try {
        const encoder = new TextEncoder();
        const command = "\x1bs" + indicator;
        await writer.write(encoder.encode(command));
        console.log(`Sent indicator command: ${indicator}`);
      } catch (error) {
        console.error("Failed to send indicator command:", error);
        setError(`Error: ${error.message}`);
      }
    };

    sendIndicatorCommand();
  }, [indicator, writer]);

  const connectToDisplay = async () => {
    if (!("serial" in navigator)) {
      setError(
        "Web Serial API not supported. Please use a compatible browser (Chrome, Edge)."
      );
      return;
    }

    try {
      setError(null);
      const serialPort = await navigator.serial.requestPort();
      await serialPort.open({ baudRate: 2400 });

      const streamWriter = serialPort.writable.getWriter();
      setPort(serialPort);
      setWriter(streamWriter);

      // Initialize the display
      const encoder = new TextEncoder();
      await streamWriter.write(encoder.encode("\x1B@")); // Initialize
      await streamWriter.write(encoder.encode("\x0C")); // Clear screen
      console.log("Display connected and initialized.");
    } catch (error) {
      console.error("There was an error opening the serial port:", error);
      setError(`Error: ${error.message}`);
    }
  };

  const disconnectFromDisplay = async () => {
    if (writer) {
      try {
        writer.releaseLock();
      } catch (error) {
        console.error("Error releasing writer lock:", error);
      }
    }
    if (port) {
      try {
        await port.close();
      } catch (error) {
        console.error("Error closing port:", error);
      }
    }
    setWriter(null);
    setPort(null);
    console.log("Display disconnected.");
  };

  return (
    <div className="App">
      <header className="App-header">
        <h2>PD-LED8 Display Controller</h2>
        <p>
          Connect to a serial display and send text in real-time as you type.
        </p>
        {error && <p className="error">{error}</p>}
        <div className="card">
          {!port ? (
            <button onClick={connectToDisplay}>Connect to Display</button>
          ) : (
            <button onClick={disconnectFromDisplay}>Disconnect Display</button>
          )}
        </div>
        <div className="card">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!port}
            aria-label="Text to send"
            placeholder="Type here to display..."
          />
        </div>
        <div className="card">
          <h4>Indicator Control</h4>
          <div className="indicator-buttons">
            <button
              onClick={() => setIndicator(1)}
              disabled={!port}
              className={indicator === 1 ? "active" : ""}
            >
              Price
            </button>
            <button
              onClick={() => setIndicator(2)}
              disabled={!port}
              className={indicator === 2 ? "active" : ""}
            >
              Total
            </button>
            <button
              onClick={() => setIndicator(3)}
              disabled={!port}
              className={indicator === 3 ? "active" : ""}
            >
              Collect
            </button>
            <button
              onClick={() => setIndicator(4)}
              disabled={!port}
              className={indicator === 4 ? "active" : ""}
            >
              Change
            </button>
            <button
              onClick={() => setIndicator(0)}
              disabled={!port}
              className={indicator === 0 ? "active" : ""}
            >
              Off
            </button>
          </div>
        </div>
        <div className="instructions">
          <h3>How to Use:</h3>
          <ol>
            <li>Connect your PD-LED8 display.</li>
            <li>Click "Connect to Display".</li>
            <li>Select the correct serial port from the browser pop-up.</li>
            <li>The message on the display will update as you type.</li>
            <li>Use the buttons to control the status indicators.</li>
          </ol>
        </div>
      </header>
    </div>
  );
};

export default App;
