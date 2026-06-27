cmake_minimum_required(VERSION 3.16)
project(pricing_engine CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Protobuf REQUIRED)
find_package(PkgConfig REQUIRED)
pkg_check_modules(GRPC REQUIRED grpc++)

# --- Code generation ---------------------------------------------------------
set(PROTO_DIR  ${CMAKE_CURRENT_SOURCE_DIR}/proto)
set(PROTO_FILE ${PROTO_DIR}/pricing.proto)
set(GEN_DIR    ${CMAKE_CURRENT_BINARY_DIR}/generated)
file(MAKE_DIRECTORY ${GEN_DIR})

add_custom_command(
  OUTPUT
    ${GEN_DIR}/pricing.pb.cc
    ${GEN_DIR}/pricing.pb.h
    ${GEN_DIR}/pricing.grpc.pb.cc
    ${GEN_DIR}/pricing.grpc.pb.h
  COMMAND protoc
    --proto_path=${PROTO_DIR}
    --cpp_out=${GEN_DIR}
    --grpc_out=${GEN_DIR}
    --plugin=protoc-gen-grpc=/usr/bin/grpc_cpp_plugin
    ${PROTO_FILE}
  DEPENDS ${PROTO_FILE}
  COMMENT "Generating protobuf + gRPC stubs from pricing.proto"
)

# --- Executable --------------------------------------------------------------
add_executable(pricing_server
  src/server.cpp
  src/pricing_engine.cpp
  ${GEN_DIR}/pricing.pb.cc
  ${GEN_DIR}/pricing.grpc.pb.cc
)

target_include_directories(pricing_server PRIVATE
  ${GEN_DIR}
  ${Protobuf_INCLUDE_DIRS}
  ${GRPC_INCLUDE_DIRS}
)

target_link_libraries(pricing_server PRIVATE
  ${Protobuf_LIBRARIES}
  ${GRPC_LIBRARIES}
)
