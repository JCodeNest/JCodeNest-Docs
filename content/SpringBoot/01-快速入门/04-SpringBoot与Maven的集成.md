---
title: SpringBoot 与 Maven 的集成
summary: 快速上手 maven-mvnd 和 Maven Wrapper。
date: 2025-09-27
cover: https://jcodenest-oss.oss-cn-shanghai.aliyuncs.com/images/20250927215645586.png
---

# SpringBoot 与 Maven 的集成

在 Spring Boot 项目开发中，Maven 作为主流构建工具，<u>负责依赖管理、编译和打包等核心任务</u>。然而，传统 Maven 构建过程往往耗时较长，尤其在大型多模块项目中。为优化这一流程，Apache 引入 **maven-mvnd（Maven Daemon）**和 **Maven Wrapper** 等工具。本文基于 Spring Boot 3.5.6 版本，介绍这些工具的机制、优势及应用场景。特别聚焦于 mvnd 的守护进程实现和 mvnw 的版本一致性保障，帮助你提升构建效率。

## 一、maven-mvnd：加速 Maven 构建的守护进程

### 1.1 基本介绍

maven-mvnd 是 Apache Maven 项目的一个分支，旨在通过借鉴 Gradle 和 Takari 的技术，<u>提供更快的 Maven 构建体验。它并非独立工具，而是对 Maven 的封装和优化，确保与原有 Maven 命令兼容</u>。目前最新版本为 1.0.3，支持嵌入 Maven，无需单独安装。

开源地址：[https://github.com/apache/maven-mvnd/](https://github.com/apache/maven-mvnd/)

### 1.2 底层实现

mvnd 的核心在于<u>守护进程（daemon）机制</u>：

- **嵌入 Maven**：安装 mvnd 后，无需额外 Maven 安装，它内部已集成。
- **长驻后台进程**：构建发生在持久的 daemon（守护进程，如果你不了解，暂且可以将其视为一个 “常驻的后台进程”）中，一个 daemon 可处理多个连续请求。
- **GraalVM Native Client**：客户端使用 GraalVM 构建的本机可执行文件，启动更快、内存占用更少。
- **并行处理**：若无空闲 daemon，可自动生成多个 daemon 处理请求。

这些设计<u>避免了传统 Maven 的重复初始化开销（关键所在）</u>。

### 1.3 为什么更快

mvnd 的性能提升源于以下优化：

- **避免 JVM 重启**：daemon 持久运行，节省每次构建的 JVM 启动时间。
- **类加载器缓存**：Maven 插件 JAR 只读取和解析一次（SNAPSHOT 除外），跨构建复用。
- **JIT 优化保留**：JVM 即时编译的本地代码持久化，减少重复编译时间，适用于插件、Maven Core 和 JDK 代码。
- **默认并行构建**：利用多 CPU 核心，线程数公式为 `Math.max(Runtime.getRuntime().availableProcessors() - 1, 1)`。在 24 核机器上，可显著加速多模块项目。

此外，控制台输出优化为非滚动视图，每线程独立显示，提升可读性。构建后输出完整 Maven 日志。

![](https://jcodenest-oss.oss-cn-shanghai.aliyuncs.com/images/103917178-94ee4500-510d-11eb-9abb-f52dae58a544.gif)

### 1.4 安装与使用

安装方式多样，详见官方手册：

- **SDKMAN!**：`sdk install mvnd`（适用于支持系统）。
- **Homebrew (macOS)**：`brew install mvndaemon/homebrew-mvnd/mvnd`（或 mvnd@1 为 1.x 系列）。
- **MacPorts**：`sudo port install mvnd`。
- 手动安装：
  1. 从 https://downloads.apache.org/maven/mvnd/ 下载最新 ZIP（如 1.0.3）。
  2. 解压并将 bin 目录添加到 PATH。
  3. 可选：在 `~/.m2/mvnd.propertie`s 设置 `java.home`（若无 JAVA_HOME）。
  4. Windows 用户若遇 VCRUNTIME140.dll 缺失，安装 Visual C++ Redistributable。
  5. macOS 用户移除隔离：`xattr -r -d com.apple.quarantine mvnd-x.y.z-darwin-amd64`。

验证安装：`mvnd --version`，输出 mvnd 和嵌入 Maven 版本。

```bash
lucky$ mvnd -version
Apache Maven Daemon (mvnd) 2.0.0-rc-3 darwin-aarch64 native client (f912362c18c9a75faf3e31a4e0e0b921206013b9)
Terminal: org.jline.terminal.impl.PosixSysTerminal with pty org.jline.terminal.impl.jni.osx.OsXNativePty
Apache Maven 4.0.0-rc-3 (3952d00ce65df6753b63a51e86b1f626c55a8df2)
Maven home: /opt/homebrew/Cellar/mvnd/2.0.0-rc-3/libexec/mvn
Java version: 23.0.2, vendor: Homebrew, runtime: /opt/homebrew/Cellar/openjdk/23.0.2/libexec/openjdk.jdk/Contents/Home
Default locale: zh_CN_#Hans, platform encoding: UTF-8
OS name: "mac os x", version: "26.0", arch: "aarch64", family: "mac"
Purged 2 log files (log available in /Users/lucky/.m2/mvnd/registry/2.0.0-rc-3/purge-2025-09-27.log)
```

使用与传统 Maven 相同，仅前缀替换为 mvnd。附加选项包括：

- `--status`：列出所有 daemon。
- `--stop`：停止所有 daemon。
- `--help`：查看完整选项。

### 1.5 速度测试

我们这里就以上一章的 Hello World 项目为例，先使用传统的 `mvn clean package` 构建：

```bash
[INFO] --- spring-boot:3.5.6:repackage (repackage) @ p1-boot-hellowprld ---
[INFO] Replacing main artifact /Users/lucky/develop/project/springboot-tech/p1-boot-hellowprld/target/p1-boot-hellowprld-1.0.0-SNAPSHOT.jar with repackaged archive, adding nested dependencies in BOOT-INF/.
[INFO] The original artifact has been renamed to /Users/lucky/develop/project/springboot-tech/p1-boot-hellowprld/target/p1-boot-hellowprld-1.0.0-SNAPSHOT.jar.original
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  5.666 s
[INFO] Finished at: 2025-09-27T22:09:00+08:00
[INFO] ------------------------------------------------------------------------
```

可以看到耗时 5.666 s，下面再用  `mvnd clean package` 构建：

```bash
[INFO] --- spring-boot:3.5.6:repackage (repackage) @ p1-boot-hellowprld ---
[INFO] Replacing main artifact /Users/lucky/develop/project/springboot-tech/p1-boot-hellowprld/target/p1-boot-hellowprld-1.0.0-SNAPSHOT.jar with repackaged archive, adding nested dependencies in BOOT-INF/.
[INFO] The original artifact has been renamed to /Users/lucky/develop/project/springboot-tech/p1-boot-hellowprld/target/p1-boot-hellowprld-1.0.0-SNAPSHOT.jar.original
[INFO] Copying cn.jcodenest.boot:p1-boot-hellowprld:pom:1.0.0-SNAPSHOT to project local repository
[INFO] Copying cn.jcodenest.boot:p1-boot-hellowprld:jar:1.0.0-SNAPSHOT to project local repository
[INFO] Copying cn.jcodenest.boot:p1-boot-hellowprld:pom:consumer:1.0.0-SNAPSHOT to project local repository
[INFO] --------------------------------------------------------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] --------------------------------------------------------------------------------------------------------------------------
[INFO] Total time:  1.741 s (Wall Clock)
[INFO] Finished at: 2025-09-27T22:11:00+08:00
[INFO] --------------------------------------------------------------------------------------------------------------------------
```

可以看到，构建时间仅需 1.741 s，遥遥领先！（注意，第一次由于后台进程还没有启动，所以时间差不多，第二次就有明显差异了）

我们通过 `mvnd --status` 可以看到后台常驻了一个 daemon 进程，这就是为什么快的原因之一：

```bash
lucky$ mvnd --status
      ID      PID                   Address   Status    RSS            Last activity  Java home
c0110a81    36368     inet:/127.0.0.1:63760     Idle    40m  2025-09-27T22:12:20.819  /opt/homebrew/Cellar/openjdk/23.0.2/libexec/openjdk.jdk/Contents/Home
```

如果你想关闭它，只需要执行 `mvnd --stop` 即可。

```bash
lucky$ mvnd --stop
Stopping 1 running daemons
lucky$ mvnd --status
      ID      PID                   Address   Status    RSS            Last activity  Java home
```

## 二、Maven Wrapper：免安装的 Maven 版本管理

### 2.1 基本介绍

Maven Wrapper（mvnw）是 Maven 的轻量包装脚本，集成于 Spring Boot 项目中，确保构建环境一致性，而无需全局安装 Maven。它**源于 maven-mvnd 项目，但专注于版本隔离**。

### 2.2 生成项目与结构

使用 Spring Initializr 生成 Spring Boot 3.5.6 项目（Maven、Java、JDK 21），默认包含 Wrapper：

- mvnw（Linux/Mac shell 脚本）。
- mvnw.cmd（Windows batch）。
- .mvn/wrapper/ 目录：包含 maven-wrapper.properties（指定 Maven 版本，如 3.9.9）和 JAR 文件。

项目结构示例：

```text
├── mvnw
├── mvnw.cmd
├── .mvn
│   └── wrapper
│       ├── maven-wrapper.jar
│       ├── maven-wrapper.properties
│       └── MavenWrapperDownloader.java
├── pom.xml
└── src/...
```

在 maven-wrapper.properties 中，可自定义版本：(注意：只需要替换版本号的部分如 3.9.9 即可！)

```bash
distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.9/apache-maven-3.9.9-bin.zip
```

下载的 Maven 存储于 `$USER_HOME/.m2/wrapper`，无需手动安装。

### 2.3 使用场景

- **免安装**：新开发者无需配置 Maven 环境。
- **版本隔离**：不同项目使用不同 Maven 版本，避免冲突。
- **一致性**：CI/CD 环境中确保构建可复现。

不适合频繁全局构建；实际工作中，多用于团队协作或遗留项目。

### 2.4 使用方式

在项目目录执行：`./mvnw clean install`（Linux/Mac）或 `mvnw.cmd clean install`（Windows）。底层调用指定 Maven 版本。

> Gradle 有类似 gradlew。

### 2.5 IDEA 中设置

在 IntelliJ IDEA 中，配置使用 Wrapper：

- 项目设置 > Build, Execution, Deployment > Build Tools > Maven > Runner > Delegate IDE build/run actions to Maven。

  ![image-20250927221915762](https://jcodenest-oss.oss-cn-shanghai.aliyuncs.com/images/image-20250927221915762.png)

- 或在 Maven 面板选择 Wrapper。

  ![image-20250927222056056](https://jcodenest-oss.oss-cn-shanghai.aliyuncs.com/images/image-20250927222056056.png)

> 参考：[https://github.com/apache/maven-mvnd/tree/master/.mvn/wrapper](https://github.com/apache/maven-mvnd/tree/master/.mvn/wrapper)

## 三、mvnd 与 mvnw 的区别与选择

mvnd 和 mvnw 均为 Maven 包装工具，但定位不同：

- **mvnd**：增强型，聚焦性能优化。通过 daemon 和 GraalVM，实现更快构建。适用于大型项目或频繁构建场景。
- **mvnw**：轻量 wrapper，确保版本一致性和免安装。适用于跨团队一致性需求。

选择取决于需求：性能优先选 mvnd，一致性优先选 mvnw。二者可结合使用（如 mvnw 集成 mvnd daemon）。在 Spring Boot 3.5.6 项目中，mvnw 默认集成，便于快速上手；mvnd 则作为扩展，提升效率。建议参考官方文档验证最新版本。