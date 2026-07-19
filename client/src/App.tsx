import { useEffect } from "react";
import "./App.css";

function App() {
  useEffect(() => {
    // @ts-ignore
    window.electron.onShortcutPressed(() => {
      console.log(" Shortcut detected ");

      // @ts-ignore
      window.electron.showOverlay();
    });
  }, []);

  return (
    <>
      <h1>hello world from nepal</h1>
    </>
  );
}

export default App;

/*
useEffect(() => {
  window.electron.onShortcutPressed(async () => {
    console.log("Shortcut detected");

    // Authentication
    if (!isLoggedIn) {
      return;
    }

    // Subscription
    if (!hasSubscription) {
      return;
    }

    // Demo
    if (!demoCompleted) {
      return;
    }

    // Everything is OK
    window.electron.showOverlay();
  });
}, []);
*/
