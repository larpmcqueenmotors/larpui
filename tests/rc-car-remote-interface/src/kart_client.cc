#include "kart_client.h"

#include "client_manager.h"
#include "client_util.h"

namespace spc {

KartClient::KartClient() = default;

void KartClient::OnTitleChange(CefRefPtr<CefBrowser> browser, const CefString& title)
{
        shared::OnTitleChange(browser, title);
}

void KartClient::OnAfterCreated(CefRefPtr<CefBrowser> browser)
{
        shared::OnAfterCreated(browser);
}

bool KartClient::DoClose(CefRefPtr<CefBrowser> browser)
{
        return shared::DoClose(browser);
}

void KartClient::OnBeforeClose(CefRefPtr<CefBrowser> browser)
{
        shared::OnBeforeClose(browser);
}

bool KartClient::OnPreKeyEvent(CefRefPtr<CefBrowser> /*browser*/,
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
