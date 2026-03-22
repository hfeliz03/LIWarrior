// ============================================================
// Minimal Chrome Extension API type declarations
// These supplement @types/chrome — if that package installs
// correctly, this file is harmless. If it doesn't, this
// provides enough types to compile.
// ============================================================

declare namespace chrome {
  namespace runtime {
    function sendMessage(message: any, callback?: (response: any) => void): Promise<any>;
    function openOptionsPage(): void;
    const onMessage: {
      addListener(
        callback: (
          message: any,
          sender: any,
          sendResponse: (response?: any) => void
        ) => boolean | void
      ): void;
    };
    const onInstalled: {
      addListener(callback: (details: { reason: string }) => void): void;
    };
  }

  namespace tabs {
    function create(options: { url: string }): void;
  }

  namespace storage {
    const local: {
      get(keys: string | string[]): Promise<Record<string, any>>;
      set(items: Record<string, any>): Promise<void>;
    };
    const onChanged: {
      addListener(
        callback: (changes: Record<string, { oldValue?: any; newValue?: any }>) => void
      ): void;
    };
  }

  namespace notifications {
    function create(
      id: string,
      options: {
        type: string;
        iconUrl: string;
        title: string;
        message: string;
        priority?: number;
      }
    ): void;
    const onClicked: {
      addListener(callback: (notificationId: string) => void): void;
    };
  }

  namespace alarms {
    function create(name: string, info: { periodInMinutes?: number; delayInMinutes?: number }): void;
    const onAlarm: {
      addListener(callback: (alarm: { name: string }) => void): void;
    };
  }
}
