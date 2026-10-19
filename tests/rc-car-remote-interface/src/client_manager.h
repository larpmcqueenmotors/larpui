#ifndef SPC_CEF_CLIENT_MANAGER_H_
#define SPC_CEF_CLIENT_MANAGER_H_

#include <list>

#include "include/base/cef_thread_checker.h"
#include "include/cef_browser.h"

namespace shared {

class ClientManager {
public:
        ClientManager();
        ~ClientManager();

        static ClientManager* GetInstance();

        void OnAfterCreated(CefRefPtr<CefBrowser> browser);
        void DoClose(CefRefPtr<CefBrowser> browser);
        void OnBeforeClose(CefRefPtr<CefBrowser> browser);
        void CloseAllBrowsers(bool force_close);
        bool IsClosing() const;

private:
        base::ThreadChecker thread_checker_;
        bool is_closing_;
        std::list<CefRefPtr<CefBrowser>> browser_list_;
};

} // namespace shared

#endif // SPC_CEF_CLIENT_MANAGER_H_
