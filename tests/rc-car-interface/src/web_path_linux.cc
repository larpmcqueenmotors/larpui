#include "web_path.h"

#include <filesystem>
#include <sstream>

namespace spc {

namespace {

std::string ToFileUrl(const std::filesystem::path& path)
{
        const std::string native = path.lexically_normal().string();
        std::ostringstream url;
        url << "file://" << native;
        return url.str();
}

} // namespace

std::string GetStartupUrl()
{
        const auto exe_dir = std::filesystem::read_symlink("/proc/self/exe").parent_path();
        return ToFileUrl(exe_dir / "web" / "index.html");
}

} // namespace spc
