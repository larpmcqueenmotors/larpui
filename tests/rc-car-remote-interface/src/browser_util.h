#ifndef SPC_CEF_BROWSER_UTIL_H_
#define SPC_CEF_BROWSER_UTIL_H_

#include "include/cef_client.h"

namespace shared {

constexpr int kScreenWidth = 1280;
constexpr int kScreenHeight = 800;

void CreateBrowser(CefRefPtr<CefClient> client,
                   const CefString& startup_url,
                   const CefBrowserSettings& settings);

} // namespace shared

#endif // SPC_CEF_BROWSER_UTIL_H_
