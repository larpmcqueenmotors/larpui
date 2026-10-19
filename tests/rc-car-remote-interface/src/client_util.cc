#include "client_util.h"

#include "client_manager.h"

#include "include/cef_command_line.h"
#include "include/views/cef_browser_view.h"
#include "include/views/cef_window.h"
#include "include/wrapper/cef_helpers.h"

namespace shared {

void OnTitleChange(CefRefPtr<CefBrowser> browser, const CefString& title)
{
        CEF_REQUIRE_UI_THREAD();

        const auto browser_view = CefBrowserView::GetForBrowser(browser);
        if (browser_view) {
                const auto window = browser_view->GetWindow();
                if (window) {
                        window->SetTitle(title);
                }
        } else {
                PlatformTitleChange(browser, title);
        }
}

void OnAfterCreated(CefRefPtr<CefBrowser> browser)
{
        CEF_REQUIRE_UI_THREAD();
        ClientManager::GetInstance()->OnAfterCreated(browser);
}

bool DoClose(CefRefPtr<CefBrowser> browser)
{
        CEF_REQUIRE_UI_THREAD();
        ClientManager::GetInstance()->DoClose(browser);
        return false;
}

void OnBeforeClose(CefRefPtr<CefBrowser> browser)
{
        CEF_REQUIRE_UI_THREAD();
        ClientManager::GetInstance()->OnBeforeClose(browser);
}

bool IsViewsEnabled()
{
        static const bool enabled = []() {
                return !CefCommandLine::GetGlobalCommandLine()->HasSwitch("use-native");
        }();
        return enabled;
}

bool IsAlloyStyleEnabled()
{
        static const bool enabled = []() {
                return CefCommandLine::GetGlobalCommandLine()->HasSwitch("use-alloy-style");
        }();
        return enabled;
}

} // namespace shared
