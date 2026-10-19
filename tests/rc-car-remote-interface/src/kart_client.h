#ifndef SPC_CEF_TABLET_CLIENT_H_
#define SPC_CEF_TABLET_CLIENT_H_

#include "include/cef_client.h"

namespace spc {

class KartClient : public CefClient,
                    public CefDisplayHandler,
                    public CefLifeSpanHandler,
                    public CefKeyboardHandler {
public:
        KartClient();

        CefRefPtr<CefDisplayHandler> GetDisplayHandler() override { return this; }
        CefRefPtr<CefLifeSpanHandler> GetLifeSpanHandler() override { return this; }
        CefRefPtr<CefKeyboardHandler> GetKeyboardHandler() override { return this; }

        void OnTitleChange(CefRefPtr<CefBrowser> browser, const CefString& title) override;
        void OnAfterCreated(CefRefPtr<CefBrowser> browser) override;
        bool DoClose(CefRefPtr<CefBrowser> browser) override;
        void OnBeforeClose(CefRefPtr<CefBrowser> browser) override;
        bool OnPreKeyEvent(CefRefPtr<CefBrowser> browser,
                           const CefKeyEvent& event,
                           CefEventHandle os_event,
                           bool* is_keyboard_shortcut) override;

private:
        IMPLEMENT_REFCOUNTING(KartClient);
};

} // namespace spc

#endif // SPC_CEF_TABLET_CLIENT_H_
