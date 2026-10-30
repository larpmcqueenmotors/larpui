#include "main.h"

#include "app_factory.h"
#include "client_manager.h"
#include "main_util.h"

#include "include/cef_application_mac.h"
#include "include/wrapper/cef_helpers.h"
#include "include/wrapper/cef_library_loader.h"

#include <filesystem>

#import <Cocoa/Cocoa.h>

@interface UiAppDelegate : NSObject <NSApplicationDelegate>
- (void)bootstrapApplication;
- (void)tryToTerminateApplication:(NSApplication*)app;
@end

@interface UiApplication : NSApplication {
@private
        BOOL handlingSendEvent_;
}
@end

@implementation UiApplication
- (BOOL)isHandlingSendEvent
{
        return handlingSendEvent_;
}

- (void)setHandlingSendEvent:(BOOL)handlingSendEvent
{
        handlingSendEvent_ = handlingSendEvent;
}

- (void)sendEvent:(NSEvent*)event
{
        CefScopedSendingEvent sendingEventScoper;
        [super sendEvent:event];
}

- (void)terminate:(id)sender
{
        UiAppDelegate* delegate = static_cast<UiAppDelegate*>([NSApp delegate]);
        [delegate tryToTerminateApplication:self];
}
@end

@implementation UiAppDelegate
- (void)bootstrapApplication
{
        [NSApplication sharedApplication];
        [[NSApplication sharedApplication] setDelegate:self];
}

- (void)tryToTerminateApplication:(NSApplication*)app
{
        (void)app;
        shared::ClientManager* manager = shared::ClientManager::GetInstance();
        if (manager && !manager->IsClosing()) {
                manager->CloseAllBrowsers(false);
        }
}

- (NSApplicationTerminateReply)applicationShouldTerminate:(NSApplication*)sender
{
        (void)sender;
        return NSTerminateNow;
}
@end

namespace shared {

int main(int argc, char* argv[])
{
        CefScopedLibraryLoader library_loader;
        if (!library_loader.LoadInMain()) {
                return 1;
        }

        @autoreleasepool {
                CefMainArgs main_args(argc, argv);
                CefRefPtr<CefCommandLine> command_line = CreateCommandLine(main_args);
                CefRefPtr<CefApp> app = CreateBrowserProcessApp();

                [UiApplication sharedApplication];

                ClientManager manager;

                CefSettings settings;
                settings.windowless_rendering_enabled = false;
                settings.no_sandbox = true;

                const auto cache_root = std::filesystem::temp_directory_path() / "larp-ui-cef";
                const std::string cache_root_str = cache_root.string();
                CefString(&settings.root_cache_path).FromASCII(cache_root_str.c_str());
                CefString(&settings.cache_path).FromASCII((cache_root / "cache").string().c_str());

                if (!CefInitialize(main_args, settings, app, nullptr)) {
                        return 1;
                }

                UiAppDelegate* delegate = [[UiAppDelegate alloc] init];
                [delegate performSelectorOnMainThread:@selector(bootstrapApplication)
                                           withObject:nil
                                        waitUntilDone:NO];

                CefRunMessageLoop();
                CefShutdown();
        }

        return 0;
}

} // namespace shared

int main(int argc, char* argv[])
{
        return shared::main(argc, argv);
}
