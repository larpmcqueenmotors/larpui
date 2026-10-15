#include "main.h"

#include "app_factory.h"
#include "client_manager.h"
#include "main_util.h"

#include "include/cef_app.h"
#include "include/wrapper/cef_helpers.h"

namespace shared {

int main(int argc, char* argv[])
{
        CefMainArgs main_args(argc, argv);
        CefRefPtr<CefCommandLine> command_line = CreateCommandLine(main_args);

        const ProcessType process_type = GetProcessType(command_line);
        if (process_type != PROCESS_TYPE_BROWSER) {
                CefRefPtr<CefApp> app;
                if (process_type == PROCESS_TYPE_RENDERER) {
                        app = CreateRendererProcessApp();
                } else {
                        app = CreateOtherProcessApp();
                }
                return CefExecuteProcess(main_args, app, nullptr);
        }

        CefRefPtr<CefApp> app = CreateBrowserProcessApp();
        ClientManager manager;

        CefSettings settings;
        settings.windowless_rendering_enabled = false;
        settings.no_sandbox = true;

        if (!CefInitialize(main_args, settings, app, nullptr)) {
                return 1;
        }

        CefRunMessageLoop();
        CefShutdown();
        return 0;
}

} // namespace shared

int main(int argc, char* argv[])
{
        return shared::main(argc, argv);
}
