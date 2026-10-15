#include "web_path.h"

#include <mach-o/dyld.h>

#include <filesystem>
#include <sstream>

namespace spc {

namespace {

std::string ToFileUrl(const std::filesystem::path& path)
{
        std::string native = path.lexically_normal().string();
        std::ostringstream url;
        url << "file://" << native;
        return url.str();
}

std::filesystem::path ExecutableDir()
{
        uint32_t size = 0;
        _NSGetExecutablePath(nullptr, &size);
        std::string buffer(size, '\0');
        _NSGetExecutablePath(buffer.data(), &size);
        return std::filesystem::path(buffer.c_str()).parent_path();
}

std::filesystem::path WebRoot()
{
        const auto exe_dir = ExecutableDir();
        if (exe_dir.filename() == "MacOS") {
                return exe_dir.parent_path() / "Resources" / "web";
        }
        return exe_dir / "web";
}

} // namespace

std::string GetStartupUrl()
{
        return ToFileUrl(WebRoot() / "index.html");
}

} // namespace spc
