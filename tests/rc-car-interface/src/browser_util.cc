#include "browser_util.h"

#include "client_util.h"

#include "include/views/cef_browser_view.h"
#include "include/views/cef_window.h"
#include "include/wrapper/cef_helpers.h"

namespace shared {

namespace {

class WindowDelegate : public CefWindowDelegate {
public:
        WindowDelegate(CefRefPtr<CefBrowserView> browser_view, cef_runtime_style_t runtime_style)
                : browser_view_(browser_view)
                , runtime_style_(runtime_style)
        {
        }

        void OnWindowCreated(CefRefPtr<CefWindow> window) override
        {
                window->AddChildView(browser_view_);
                window->SetTitle("Ui");
                window->CenterWindow(CefSize(kScreenWidth, kScreenHeight));
                window->Show();
                browser_view_->RequestFocus();
        }

        void OnWindowDestroyed(CefRefPtr<CefWindow> /*window*/) override
        {
                browser_view_ = nullptr;
        }

        bool CanClose(CefRefPtr<CefWindow> /*window*/) override
        {
                const auto browser = browser_view_->GetBrowser();
                if (browser) {
                        return browser->GetHost()->TryCloseBrowser();
                }
                return true;
        }

        CefSize GetPreferredSize(CefRefPtr<CefView> /*view*/) override
        {
                return CefSize(kScreenWidth, kScreenHeight);
        }

        CefSize GetMinimumSize(CefRefPtr<CefView> /*view*/) override
        {
                return CefSize(kScreenWidth, kScreenHeight);
        }

        CefSize GetMaximumSize(CefRefPtr<CefView> /*view*/) override
        {
                return CefSize(kScreenWidth, kScreenHeight);
        }

        cef_runtime_style_t GetWindowRuntimeStyle() override
        {
                return runtime_style_;
        }

private:
        CefRefPtr<CefBrowserView> browser_view_;
        const cef_runtime_style_t runtime_style_;

        IMPLEMENT_REFCOUNTING(WindowDelegate);
};

class BrowserViewDelegate : public CefBrowserViewDelegate {
public:
        explicit BrowserViewDelegate(cef_runtime_style_t runtime_style)
                : runtime_style_(runtime_style)
        {
        }

        bool OnPopupBrowserViewCreated(CefRefPtr<CefBrowserView> /*browser_view*/,
                                       CefRefPtr<CefBrowserView> popup_browser_view,
                                       bool /*is_devtools*/) override
        {
                CefWindow::CreateTopLevelWindow(new WindowDelegate(popup_browser_view, runtime_style_));
                return true;
        }

        cef_runtime_style_t GetBrowserRuntimeStyle() override
        {
                return runtime_style_;
        }

private:
        const cef_runtime_style_t runtime_style_;

        IMPLEMENT_REFCOUNTING(BrowserViewDelegate);
};

} // namespace

void CreateBrowser(CefRefPtr<CefClient> client,
                   const CefString& startup_url,
                   const CefBrowserSettings& settings)
{
        CEF_REQUIRE_UI_THREAD();

        const auto runtime_style = IsAlloyStyleEnabled() ? CEF_RUNTIME_STYLE_ALLOY : CEF_RUNTIME_STYLE_DEFAULT;

        if (IsViewsEnabled()) {
                const auto browser_view = CefBrowserView::CreateBrowserView(
                        client,
                        startup_url,
                        settings,
                        nullptr,
                        nullptr,
                        new BrowserViewDelegate(runtime_style));
                CefWindow::CreateTopLevelWindow(new WindowDelegate(browser_view, runtime_style));
                return;
        }

        CefWindowInfo window_info;
#if defined(OS_WIN)
        window_info.SetAsPopup(nullptr, "Ui");
#endif
        window_info.runtime_style = runtime_style;
        window_info.bounds = CefRect(0, 0, kScreenWidth, kScreenHeight);
        CefBrowserHost::CreateBrowser(window_info, client, startup_url, settings, nullptr, nullptr);
}

} // namespace shared
