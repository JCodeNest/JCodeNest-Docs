---
title: SpringBoot 安装与集成
summary: 快速集成 SpringBoot 以及编写你的第一个 Hello World。
date: 2025-09-27
cover: https://jcodenest-oss.oss-cn-shanghai.aliyuncs.com/images/20250927215645586.png
---

# SpringBoot 安装与集成

Spring Boot 的安装与集成是构建高效 Java 应用程序的基础步骤。作为 Spring 生态的核心框架，Spring Boot 通过简化依赖管理和构建过程，提升开发效率。不过 SpringBoot 官方提供了两种集成方式，这里我们聚焦于 Maven 集成方式，剖析一下继承 `spring-boot-starter-parent` 与导入 `spring-boot-dependencies` 的区别、底层机制及选择考量。这一问题往往在其他资源中被浅显带过，导致开发者对二者差异缺乏深刻理解。我将从浅入深展开讨论，并以 Spring Boot 3.5.6（当前最新 GA 版本）为基础，结合官方机制，提供清晰的代码示例和决策指导。随后，通过一个 Hello World 接口示例，演示快速开发流程。

## 一、集成方式概述

Spring Boot 支持多种集成途径，主要包括：

- 使用 Maven 或 Gradle 等构建工具插件。
- 使用 Spring Boot CLI 命令行工具。

鉴于 Maven 是 Java 开发中最主流的构建工具，许多开源项目和文档均以此为基础，本文以 Maven 为焦点进行阐述。若需 Maven 基础知识，可参考相关教程资源。

## 二、使用 Maven 集成 Spring Boot

Maven 通过 POM（Project Object Model）文件管理项目依赖和构建。**Spring Boot 提供两种 Maven 集成策略：继承父 POM 或导入依赖管理 BOM（Bill of Materials）**。二者均确保依赖版本兼容，但实现机制、便利性和灵活性存在显著差异。下面从基础概念入手，逐步深入剖析。

### 2.1 基础概念回顾

在开始前，理解 Maven 关键机制有助于澄清后面介绍的差异：

- **POM 继承**：<u>Maven 支持单继承模型，子项目可继承父 POM 的配置</u>，包括 `<properties>`、`<dependencyManagement>`、`<pluginManagement>` 和 `<build>` 等部分。这类似于面向对象编程中的类继承，<u>提供默认配置并允许覆盖</u>。
- **依赖管理（Dependency Management）**：通过 `<dependencyManagement>` <u>声明依赖版本，但不实际引入依赖。子项目引用时无需指定版本</u>，确保一致性。
- **BOM**：一种特殊的 POM，仅用于依赖管理，常以 `<type>pom</type>` 和 `<scope>import</scope>` 导入，提供版本清单。

Spring Boot 利用这些机制简化集成。

### 2.2 策略一：继承 spring-boot-starter-parent 父项目

此方式通过在项目 POM 中声明  `<parent>` 标签继承 Spring Boot 的父 POM：

```xml
<!-- 从 Spring Boot 父项目中继承 -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.5.6</version>
</parent>
```

`spring-boot-starter-parent` 本身是一个 POM 文件，其核心是继承 `spring-boot-dependencies`（作为其父级），并扩展额外配置。考察其 POM 结构（基于 3.5.6 版本）可以看到如下设计。

**父级继承**：直接继承 `spring-boot-dependencies`，导入所有 Spring Boot 生态依赖的版本定义，确保兼容性。

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-dependencies</artifactId>
    <version>3.5.6</version>
</parent>
```

**属性定义（`<properties>`）**：提供默认项目设置，如 Java 版本、编码和资源分隔符。这些可被子项目覆盖。

```xml
<properties>
    <java.version>17</java.version>  <!-- 默认 Java 17，可覆盖为 21 等 -->
    <resource.delimiter>@</resource.delimiter>
    <maven.compiler.source>${java.version}</maven.compiler.source>
    <maven.compiler.target>${java.version}</maven.compiler.target>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
</properties>
```

**插件管理（`<pluginManagement>`）**：预定义构建插件配置，如 `spring-boot-maven-plugin` 的 `repackage` 目标和主类设置。子项目无需重复配置。

```xml
<build>
    <pluginManagement>
        <plugins>
            <!-- ... 其他插件 ... -->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <executions>
                    <execution>
                        <id>repackage</id>
                        <goals>
                            <goal>repackage</goal>
                        </goals>
                    </execution>
                </executions>
                <configuration>
                    <mainClass>${start-class}</mainClass>
                </configuration>
            </plugin>
        </plugins>
    </pluginManagement>
</build>
```

这一继承机制使子项目自动获取这些默认值，简化构建。

---

通过上述分析，这样的设计具备如下优势：

**插件配置简化**：插件仅需声明坐标，无需额外执行或配置细节。因为父级 `spring-boot-starter-parent` 已处理 `repackage` 等，减少 boilerplate 代码。例如，添加 `spring-boot-maven-plugin`：

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
    </plugins>
</build>
```

**版本覆盖便捷**：通过属性覆盖依赖版本，而非显式指定。`spring-boot-dependencies` 定义了如 `slf4j.version` 的属性，继承后可直接覆盖，这全局生效于所有使用 SLF4J 的依赖，提升维护性：

```xml
<properties>
    <slf4j.version>1.7.36</slf4j.version>
</properties>
```

**开箱即用**：适合单一项目，提供一站式默认（如 UTF-8 编码、Java 编译版本），加速入门。

> 【缺点】任何形式只要出现了多种方案，肯定具有其优劣，而通过继承的方式最大的缺点就是 “**继承限制**”。根本原因还是 “**Maven 只支持单继承**”，若项目需继承自定义父 POM（如公司级配置），则冲突，无法同时继承 `spring-boot-starter-parent`。这在多模块或企业环境中常见，限制扩展性。

### 2.3 策略二：导入 spring-boot-dependencies 依赖

此方式通过 `<dependencyManagement>` 导入 BOM：

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <!-- Import dependency management from Spring Boot -->
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>3.5.6</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

`spring-boot-dependencies` 是一个纯 BOM POM，仅包含 `<dependencyManagement>`，定义 Spring Boot 所有依赖的版本（如 Spring Core、Tomcat 等）。**导入后，项目获取版本清单，但不继承属性或插件管理。无额外默认配置，需手动处理编译、编码等**。

先来看看这种方式为我们带来的优点：

1. **灵活扩展**：不占用继承槽，可与自定义父 POM 结合。适合多模块项目或已有继承结构。
2. **精确控制**：开发者手动管理属性和插件，避免意外默认。

再来看看这种方式不可避免的缺点：

1. **配置繁琐**：插件需完整配置。例如，`spring-boot-maven-plugin` 要求显式定义执行和主类。
2. **版本覆盖复杂**：<u>需在每个依赖中指定版本，而非属性覆盖 (这点需要格外注意嗷！跟多朋友会误以为通过属性就能覆盖)</u>，这增加维护负担，尤其在大型项目中。

```xml
<dependencies>
    <dependency>
        <groupId>org.slf4j</groupId>
        <artifactId>slf4j-api</artifactId>
        <version>1.7.36</version>  <!-- 手动指定 -->
    </dependency>
</dependencies>
```

### 2.3 二者区别与选择考量

区别总结：

* **范围**：继承提供全面配置（依赖版本 + 属性 + 插件）；导入仅限依赖版本。
* **机制**：继承如 “全包服务”，利用 Maven 继承链；导入如 “菜单点菜”，仅注入版本清单。
* **底层差异**：继承构建于 BOM 之上，添加 Maven 最佳实践；导入是纯版本管理，避免膨胀。

---

选择考量：

* **优先继承**：若项目简单、无其他父级需求，选择继承以获便利（如新手或独立应用）。
* **优先导入（推荐）**：在企业多模块项目中，选择导入以保留灵活性，避免继承冲突。从设计原则看，导入符合 “最小干预” 理念，适合长期维护。
* **不影响功能**：二者均不改变 Spring Boot 运行时行为，仅影响构建。
* **混合使用**：在多模块项目中，根模块导入 BOM，子模块继承自定义父级。

## 三、Spring Boot 接口快速开发：Hello World 实战

下面我们以一个简单 Web 接口为例，演示集成后开发流程。

### 3.1 生成项目

使用官方 Initializr：[https://start.spring.io/](https://start.spring.io/)

配置：Maven、Java、Spring Boot 3.5.6、JDK 21。

![image-20250927213248590](https://jcodenest-oss.oss-cn-shanghai.aliyuncs.com/images/image-20250927213248590.png)

项目结构如下，确定符合预期后点击 【DOWNLOAD】下载即可：

![image-20250927213445020](https://jcodenest-oss.oss-cn-shanghai.aliyuncs.com/images/image-20250927213445020.png)

打开你幸苦破解的 IDEA，这里我创建了一个空的工程目录，直接将上面下载的压缩包解压丢进这个空项目即可：

<img src="https://jcodenest-oss.oss-cn-shanghai.aliyuncs.com/images/image-20250927213832403.png" alt="image-20250927213832403" style="zoom:50%;" />

注意，如果你的项目通过 IDEA 打开后没有识别为 Maven 项目，可以右键 POM 选择【添加为 Maven 项目】即可：

![image-20250927214048410](https://jcodenest-oss.oss-cn-shanghai.aliyuncs.com/images/image-20250927214048410.png)

通过查看项目 POM，发现 POM 默认继承父项目 `spring-boot-starter-parent`，包含 `spring-boot-starter-test` 和 `spring-boot-maven-plugin`，当然还有我们在 Initializr 选择的 Spring Web。前面我们说过 SpringBoot 的开箱即用的能力，这里以 Web 为例，当我们引入 `spring-boot-starter-web` 便自动获得了 Web 开发的各种组件，如果你学习过 Spring Framework 将会感受到这是一个多大的改革。

![image-20250927214607978](https://jcodenest-oss.oss-cn-shanghai.aliyuncs.com/images/image-20250927214607978.png)

### 3.2 编写接口

通过 Initializr 创建的工程，已经默认为我们准备了可以直接运行的相关代码，我们只需要在启动类快速添加一个 Controller 即可：

1. 类上添加 @RestController 注解；
2. 编写一个 REST 接口，返回 "hello world."。

```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController // 标识这是一个 RESTful 控制器(要引入 spring-boot-starter-web 依赖才有嗷)
@SpringBootApplication
public class P1BootHellowprldApplication {

	public static void main(String[] args) {
		SpringApplication.run(P1BootHellowprldApplication.class, args);
	}

	@RequestMapping(
			method = RequestMethod.GET, // 标识这是一个 GET 请求
			value = "/hello" // 标识这是一个 /hello 路径的请求
	)
	public String helloWorld() {
		return "hello world.";
	}

}
```

### 3.3 启动应用

1. **Main 方法启动**：直接运行 `DemoApplication` 的 `main`。
2. **Maven 插件启动（推荐）**：执行 `mvn spring-boot:run`，利用插件处理资源。

启动日志示例（基于 3.5.6，Tomcat 10.1.x）：

```kotlin
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/

 :: Spring Boot ::                (v3.5.6)

... INFO ... : Starting Servlet engine: [Apache Tomcat/10.1.46]
... INFO ... :  Tomcat started on port 8080 (http) with context path '/'
... INFO ... :  Started P1BootHellowprldApplication in 0.557 seconds (process running for 0.666)
```

### 3.4 测试接口

访问 [http://localhost:8080/hello](http://localhost:8080/hello)，返回 "hello world."。当然，你直接通过 curl 访问也行：

```bash
lucky$ curl -i http://localhost:8080/hello
HTTP/1.1 200 
Content-Type: text/plain;charset=UTF-8
Content-Length: 12
Date: Sat, 27 Sep 2025 13:53:15 GMT

hello world.%   
```

恭喜你，已经经过 SpringBoot 了 👏！