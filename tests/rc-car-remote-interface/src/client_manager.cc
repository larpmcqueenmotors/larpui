#include "client_manager.h"

#include "include/cef_app.h"
#include "include/wrapper/cef_helpers.h"

namespace shared {

namespace {

ClientManager* g_manager = nullptr;

} // namespace

ClientManager::ClientManager()
        : is_closing_(false)
{
        g_manager = this;
}

ClientManager::~ClientManager()
{
        DCHECK(thread_checker_.CalledOnValidThread());
        DCHECK(browser_list_.empty());
        g_manager = nullptr;
}

ClientManager* ClientManager::GetInstance()
{
        CEF_REQUIRE_UI_THREAD();
        DCHECK(g_manager);
        return g_manager;
}

void ClientManager::OnAfterCreated(CefRefPtr<CefBrowser> browser)
{
        DCHECK(thread_checker_.CalledOnValidThread());
        browser_list_.push_back(browser);
}

void ClientManager::DoClose(CefRefPtr<CefBrowser> browser)
{
        DCHECK(thread_checker_.CalledOnValidThread());
        if (browser_list_.size() == 1U) {
                is_closing_ = true;
        }
}

void ClientManager::OnBeforeClose(CefRefPtr<CefBrowser> browser)
{
        DCHECK(thread_checker_.CalledOnValidThread());

        for (auto it = browser_list_.begin(); it != browser_list_.end(); ++it) {
                if ((*it)->IsSame(browser)) {
                        browser_list_.erase(it);
                        break;
                }
        }

        if (browser_list_.empty()) {
                CefQuitMessageLoop();
        }
}

void ClientManager::CloseAllBrowsers(bool force_close)
{
        DCHECK(thread_checker_.CalledOnValidThread());
        if (browser_list_.empty()) {
                return;
        }

        for (const auto& browser : browser_list_) {
                browser->GetHost()->CloseBrowser(force_close);
        }
}

bool ClientManager::IsClosing() const
{
        DCHECK(thread_checker_.CalledOnValidThread());
        return is_closing_;
}

} // namespace shared
