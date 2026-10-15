#include "client_util.h"

#import <Cocoa/Cocoa.h>

#include "include/cef_browser.h"

namespace shared {

void PlatformTitleChange(CefRefPtr<CefBrowser> browser, const CefString& title)
{
        NSView* view = CAST_CEF_WINDOW_HANDLE_TO_NSVIEW(browser->GetHost()->GetWindowHandle());
        NSWindow* window = [view window];
        const std::string title_str(title);
        NSString* str = [NSString stringWithUTF8String:title_str.c_str()];
        [window setTitle:str];
}

} // namespace shared
