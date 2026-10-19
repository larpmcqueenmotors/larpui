# Copyright (c) 2016 The Chromium Embedded Framework Authors.
# Adapted for Quor kart CEF preview.

function(DownloadCEF platform channel version download_dir)
    if(channel STREQUAL "beta")
        set(channel_part "_beta")
    else()
        set(channel_part "")
    endif()

    set(CEF_DISTRIBUTION "cef_binary_${version}_${platform}${channel_part}")
    set(CEF_DOWNLOAD_DIR "${download_dir}")
    set(CEF_ROOT "${CEF_DOWNLOAD_DIR}/${CEF_DISTRIBUTION}" CACHE INTERNAL "CEF_ROOT")

    if(NOT IS_DIRECTORY "${CEF_ROOT}")
        set(CEF_DOWNLOAD_FILENAME "${CEF_DISTRIBUTION}.tar.bz2")
        set(CEF_DOWNLOAD_PATH "${CEF_DOWNLOAD_DIR}/${CEF_DOWNLOAD_FILENAME}")
        if(NOT EXISTS "${CEF_DOWNLOAD_PATH}")
            set(CEF_DOWNLOAD_URL "https://cef-builds.spotifycdn.com/${CEF_DOWNLOAD_FILENAME}")
            string(REPLACE "+" "%2B" CEF_DOWNLOAD_URL_ESCAPED ${CEF_DOWNLOAD_URL})

            message(STATUS "Downloading ${CEF_DOWNLOAD_PATH}.sha1 ...")
            file(DOWNLOAD "${CEF_DOWNLOAD_URL_ESCAPED}.sha1" "${CEF_DOWNLOAD_PATH}.sha1")
            file(READ "${CEF_DOWNLOAD_PATH}.sha1" CEF_SHA1)

            message(STATUS "Downloading ${CEF_DOWNLOAD_PATH} ...")
            file(
                DOWNLOAD "${CEF_DOWNLOAD_URL_ESCAPED}" "${CEF_DOWNLOAD_PATH}"
                EXPECTED_HASH SHA1=${CEF_SHA1}
                SHOW_PROGRESS
            )
        endif()

        message(STATUS "Extracting ${CEF_DOWNLOAD_PATH} ...")
        execute_process(
            COMMAND ${CMAKE_COMMAND} -E tar xjf "${CEF_DOWNLOAD_PATH}"
            WORKING_DIRECTORY ${CEF_DOWNLOAD_DIR}
        )
    endif()
endfunction()
