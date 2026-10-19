#include "app_factory.h"
#include "browser_util.h"
#include "kart_client.h"
#include "web_path.h"

namespace spc {

class BrowserApp : public CefApp, public CefBrowserProcessHandler {
public:
        CefRefPtr<CefBrowserProcessHandler> GetBrowserProcessHandler() override
        {
                return this;
        }

        void OnBeforeCommandLineProcessing(const CefString& process_type,
                                           CefRefPtr<CefCommandLine> command_line) override
        {
                if (!process_type.empty()) {
                        return;
                }

#if defined(OS_MACOSX)
                command_line->AppendSwitch("use-mock-keychain");
#endif
                command_line->AppendSwitch("use-alloy-style");
        }

        void OnContextInitialized() override
        {
                CefBrowserSettings settings;
                settings.background_color = CefColorSetARGB(255, 7, 7, 8);
                shared::CreateBrowser(new KartClient(), GetStartupUrl(), settings);
        }

private:
        IMPLEMENT_REFCOUNTING(BrowserApp);
};

} // namespace spc

namespace shared {

CefRefPtr<CefApp> CreateBrowserProcessApp()
{
        return new spc::BrowserApp();
}

} // namespace shared
