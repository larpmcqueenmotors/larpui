#include "ui_client.h"

#include "client_manager.h"
#include "client_util.h"

namespace spc {

UiClient::UiClient() = default;

void UiClient::OnTitleChange(CefRefPtr<CefBrowser> browser, const CefString& title)
{
        shared::OnTitleChange(browser, title);
}

void UiClient::OnAfterCreated(CefRefPtr<CefBrowser> browser)
{
        shared::OnAfterCreated(browser);
}

bool UiClient::DoClose(CefRefPtr<CefBrowser> browser)
{
        return shared::DoClose(browser);
}

void UiClient::OnBeforeClose(CefRefPtr<CefBrowser> browser)
{
        shared::OnBeforeClose(browser);
}

bool UiClient::OnPreKeyEvent(CefRefPtr<CefBrowser> /*browser*/,
                                const CefKeyEvent& event,
                                CefEventHandle /*os_event*/,
                                bool* /*is_keyboard_shortcut*/)
{
#if defined(OS_MACOSX)
        if (event.type == KEYEVENT_RAWKEYDOWN && event.native_key_code == 53) {
                return false;
        }
#endif
        if (event.type == KEYEVENT_RAWKEYDOWN && event.windows_key_code == 27) {
                shared::ClientManager::GetInstance()->CloseAllBrowsers(false);
                return true;
        }
        return false;
}

} // namespace spc
