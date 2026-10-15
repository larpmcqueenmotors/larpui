#include "main_util.h"

#include "include/cef_command_line.h"

namespace shared {

CefRefPtr<CefCommandLine> CreateCommandLine(const CefMainArgs& main_args)
{
        CefRefPtr<CefCommandLine> command_line = CefCommandLine::CreateCommandLine();
#if defined(OS_WIN)
        command_line->InitFromString(::GetCommandLineW());
#else
        command_line->InitFromArgv(main_args.argc, main_args.argv);
#endif
        return command_line;
}

ProcessType GetProcessType(const CefRefPtr<CefCommandLine>& command_line)
{
        const std::string process_type = command_line->GetSwitchValue("type");
        if (process_type.empty()) {
                return PROCESS_TYPE_BROWSER;
        }
        if (process_type == "renderer") {
                return PROCESS_TYPE_RENDERER;
        }
        return PROCESS_TYPE_OTHER;
}

} // namespace shared
