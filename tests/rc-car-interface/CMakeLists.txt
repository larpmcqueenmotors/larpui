cmake_minimum_required(VERSION 3.21)

set(CMAKE_CONFIGURATION_TYPES Debug Release)

project(larp_kart_cef CXX)

set(USE_SANDBOX OFF CACHE BOOL "Disable CEF sandbox for local Quor-7 preview builds")

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

if(NOT CMAKE_BUILD_TYPE)
        set(CMAKE_BUILD_TYPE Debug)
endif()

#
# CEF distribution
#

set(CEF_VERSION "144.0.6+g5f7e671+chromium-144.0.7559.59")
set(CEF_CHANNEL "")

if("${CMAKE_SYSTEM_NAME}" STREQUAL "Darwin")
        if("${PROJECT_ARCH}" STREQUAL "arm64")
                set(CEF_PLATFORM "macosarm64")
        elseif("${PROJECT_ARCH}" STREQUAL "x86_64")
                set(CEF_PLATFORM "macosx64")
        elseif("${CMAKE_HOST_SYSTEM_PROCESSOR}" STREQUAL "arm64")
                set(PROJECT_ARCH "arm64")
                set(CEF_PLATFORM "macosarm64")
        else()
                set(PROJECT_ARCH "x86_64")
                set(CEF_PLATFORM "macosx64")
        endif()
elseif("${CMAKE_SYSTEM_NAME}" STREQUAL "Linux")
        if("${CMAKE_SYSTEM_PROCESSOR}" STREQUAL "aarch64")
                set(CEF_PLATFORM "linuxarm64")
        elseif(CMAKE_SIZEOF_VOID_P MATCHES 8)
                set(CEF_PLATFORM "linux64")
        else()
                message(FATAL_ERROR "Unsupported Linux architecture.")
        endif()
elseif("${CMAKE_SYSTEM_NAME}" STREQUAL "Windows")
        if(CMAKE_SIZEOF_VOID_P MATCHES 8)
                set(CEF_PLATFORM "windows64")
        else()
                set(CEF_PLATFORM "windows32")
        endif()
else()
        message(FATAL_ERROR "Unsupported platform.")
endif()

set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${CMAKE_CURRENT_SOURCE_DIR}/cmake")
include(DownloadCEF)
DownloadCEF("${CEF_PLATFORM}" "${CEF_CHANNEL}" "${CEF_VERSION}" "${CMAKE_CURRENT_SOURCE_DIR}/third_party/cef")

set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${CEF_ROOT}/cmake")
find_package(CEF REQUIRED)

add_subdirectory(${CEF_LIBCEF_DLL_WRAPPER_PATH} libcef_dll_wrapper)

#
# Target layout
#

set(CEF_TARGET "kart_cef")
set(CEF_HELPER_TARGET "kart_cef_Helper")
set(CEF_HELPER_OUTPUT_NAME "kart_cef Helper")

set(CEF_COMMON_SRCS
        src/app_browser.cc
        src/app_other.cc
        src/app_renderer.cc
        src/browser_util.cc
        src/client_manager.cc
        src/client_util.cc
        src/kart_client.cc
        src/main_util.cc
)

set(CEF_BROWSER_SRCS
        ${CEF_COMMON_SRCS}
)

set(CEF_HELPER_SRCS
        src/app_other.cc
        src/app_renderer.cc
        src/main_util.cc
        src/process_helper_mac.mm
)

if(OS_MAC)
        list(APPEND CEF_BROWSER_SRCS src/client_util_mac.mm src/main_mac.mm src/web_path_mac.mm)
elseif(OS_LINUX)
        list(APPEND CEF_BROWSER_SRCS src/client_util_linux.cc src/main_linux.cc src/web_path_linux.cc)
endif()

if(GEN_NINJA OR GEN_MAKEFILES)
        set(CEF_TARGET_OUT_DIR "${CMAKE_BINARY_DIR}/${CMAKE_BUILD_TYPE}")
else()
        set(CEF_TARGET_OUT_DIR "${CMAKE_BINARY_DIR}/$<CONFIG>")
endif()

include_directories(${CMAKE_CURRENT_SOURCE_DIR}/src)

macro(SPC_COPY_WEB target destination)
        add_custom_target(
                ${target}_web_assets ALL
                COMMAND ${CMAKE_COMMAND} -E copy_directory
                        "${CMAKE_CURRENT_SOURCE_DIR}/web"
                        "${destination}/web"
                DEPENDS ${target}
                COMMENT "Syncing CEF web assets"
                VERBATIM
        )
endmacro()

#
# macOS app bundle
#

if(OS_MAC)
        set(EXECUTABLE_NAME "${CEF_TARGET}")
        set(PRODUCT_NAME "${CEF_TARGET}")
        set(SHARED_INFO_PLIST "${CMAKE_CURRENT_SOURCE_DIR}/mac/Info.plist.in")
        set(SHARED_HELPER_INFO_PLIST "${CMAKE_CURRENT_SOURCE_DIR}/mac/helper-Info.plist.in")

        add_executable(${CEF_TARGET} MACOSX_BUNDLE ${CEF_BROWSER_SRCS})
        SET_EXECUTABLE_TARGET_PROPERTIES(${CEF_TARGET})
        add_dependencies(${CEF_TARGET} libcef_dll_wrapper)
        target_link_libraries(${CEF_TARGET} libcef_dll_wrapper ${CEF_STANDARD_LIBS})
        set_target_properties(${CEF_TARGET} PROPERTIES
                MACOSX_BUNDLE_INFO_PLIST "${SHARED_INFO_PLIST}"
                RUNTIME_OUTPUT_DIRECTORY "${CEF_TARGET_OUT_DIR}"
        )

        set(CEF_APP "${CEF_TARGET_OUT_DIR}/${CEF_TARGET}.app")
        COPY_MAC_FRAMEWORK("${CEF_TARGET}" "${CEF_BINARY_DIR}" "${CEF_APP}")
        SPC_COPY_WEB(${CEF_TARGET} "${CEF_APP}/Contents/Resources")

        foreach(_suffix_list ${CEF_HELPER_APP_SUFFIXES})
                string(REPLACE ":" ";" _suffix_list ${_suffix_list})
                list(GET _suffix_list 0 _name_suffix)
                list(GET _suffix_list 1 _target_suffix)
                list(GET _suffix_list 2 _plist_suffix)

                set(_helper_target "${CEF_HELPER_TARGET}${_target_suffix}")
                set(_helper_output_name "${CEF_HELPER_OUTPUT_NAME}${_name_suffix}")

                set(_helper_info_plist "${CMAKE_CURRENT_BINARY_DIR}/helper-Info${_target_suffix}.plist")
                file(READ "${SHARED_HELPER_INFO_PLIST}" _plist_contents)
                string(REPLACE "\${EXECUTABLE_NAME}" "${_helper_output_name}" _plist_contents "${_plist_contents}")
                string(REPLACE "\${PRODUCT_NAME}" "${CEF_TARGET}" _plist_contents "${_plist_contents}")
                string(REPLACE "\${BUNDLE_ID_SUFFIX}" "${_plist_suffix}" _plist_contents "${_plist_contents}")
                string(REPLACE "\${VERSION_SHORT}" "0.1.0" _plist_contents "${_plist_contents}")
                file(WRITE "${_helper_info_plist}" "${_plist_contents}")

                add_executable(${_helper_target} MACOSX_BUNDLE ${CEF_HELPER_SRCS})
                SET_EXECUTABLE_TARGET_PROPERTIES(${_helper_target})
                add_dependencies(${_helper_target} libcef_dll_wrapper)
                target_link_libraries(${_helper_target} libcef_dll_wrapper ${CEF_STANDARD_LIBS})
                set_target_properties(${_helper_target} PROPERTIES
                        MACOSX_BUNDLE_INFO_PLIST "${_helper_info_plist}"
                        OUTPUT_NAME "${_helper_output_name}"
                        RUNTIME_OUTPUT_DIRECTORY "${CEF_TARGET_OUT_DIR}"
                )
                add_dependencies(${CEF_TARGET} "${_helper_target}")

                add_custom_command(
                        TARGET ${CEF_TARGET}
                        POST_BUILD
                        COMMAND ${CMAKE_COMMAND} -E copy_directory
                                "${CEF_TARGET_OUT_DIR}/${_helper_output_name}.app"
                                "${CEF_APP}/Contents/Frameworks/${_helper_output_name}.app"
                        VERBATIM
                )
        endforeach()
endif()

#
# Linux executable
#

if(OS_LINUX)
        ADD_LOGICAL_TARGET("libcef_lib" "${CEF_LIB_DEBUG}" "${CEF_LIB_RELEASE}")

        add_executable(${CEF_TARGET} ${CEF_BROWSER_SRCS})
        SET_EXECUTABLE_TARGET_PROPERTIES(${CEF_TARGET})
        add_dependencies(${CEF_TARGET} libcef_dll_wrapper)
        target_link_libraries(${CEF_TARGET} libcef_lib libcef_dll_wrapper ${CEF_STANDARD_LIBS})
        set_target_properties(${CEF_TARGET} PROPERTIES
                RUNTIME_OUTPUT_DIRECTORY "${CEF_TARGET_OUT_DIR}"
                INSTALL_RPATH "$ORIGIN"
                BUILD_WITH_INSTALL_RPATH TRUE
        )

        COPY_FILES("${CEF_TARGET}" "${CEF_BINARY_FILES}" "${CEF_BINARY_DIR}" "${CEF_TARGET_OUT_DIR}")
        COPY_FILES("${CEF_TARGET}" "${CEF_RESOURCE_FILES}" "${CEF_RESOURCE_DIR}" "${CEF_TARGET_OUT_DIR}")
        SPC_COPY_WEB(${CEF_TARGET} "${CEF_TARGET_OUT_DIR}")
        SET_LINUX_SUID_PERMISSIONS("${CEF_TARGET}" "${CEF_TARGET_OUT_DIR}/chrome-sandbox")
endif()

PRINT_CEF_CONFIG()
