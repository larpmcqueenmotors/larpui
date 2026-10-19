#ifndef SPC_CEF_MAIN_UTIL_H_
#define SPC_CEF_MAIN_UTIL_H_

#include "include/cef_command_line.h"

namespace shared {

CefRefPtr<CefCommandLine> CreateCommandLine(const CefMainArgs& main_args);

enum ProcessType {
        PROCESS_TYPE_BROWSER,
        PROCESS_TYPE_RENDERER,
        PROCESS_TYPE_OTHER,
};

ProcessType GetProcessType(const CefRefPtr<CefCommandLine>& command_line);

} // namespace shared

#endif // SPC_CEF_MAIN_UTIL_H_
