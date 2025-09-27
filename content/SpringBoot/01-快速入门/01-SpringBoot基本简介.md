---
title: SpringBoot 基本简介
summary: 快速了解 SpringBoot 诞生背景、基本介绍、核心思想、基本特性和核心模块。
date: 2025-09-27
cover: https://jcodenest-oss.oss-cn-shanghai.aliyuncs.com/images/20250927215645586.png
---

# SpringBoot 基本简介

Spring 在 Java 生态的重要地位，想必都有所耳闻，其灵活性和扩展性使其与众多主流框架无缝集成。下面我们再次快速认识一下这个强悍框架的基本概念，作为一个基本回顾。当然，如果你没接触过可能理解起来会比较生涩，但是并不影响你使用它，使用的时日多了再回过头看来，自然就理解了。

## 一、诞生背景

Spring 框架的流行源于其两大核心机制：**控制反转（Inversion of Control, IOC）**和**面向切面编程（Aspect-Oriented Programming, AOP）**。

* IOC 通过<u>管理对象依赖关系</u>显著降低耦合度；

* AOP 利用<u>动态代理</u>实现如事务管理、缓存和日志记录等功能。

这些特性使 Spring 能够与各种 Java 框架结合，形成强大的生态。或者，你大可把它看作一个排插好了，各种插拔式的能力让我们快速集成 Java 生态的各大框架。

尽管如此，传统 Spring 集成过程依赖 XML 配置文件或注解式 Java 配置，这要求开发者对组件有深入了解，并编写冗长代码，增加了使用门槛。为解决这一问题，Spring Boot 应运而生。它以简化 Spring 使用、实现开箱即用为目标，允许开发者快速上手。

Spring Boot 最初由 [Pivotal 公司](https://zh.wikipedia.org/zh-hk/Pivotal)团队开发，于 2014 年发布首个公开版本。2019 年，[VMware Tanzu](https://www.vmware.com/products/app-platform/tanzu) 收购 Pivotal，现今所有 Spring 项目均归其旗下。这可从 Spring Boot 官网（[spring.io/projects/spring-boot](spring.io/projects/spring-boot)）中观察到相关归属信息。

![Spring Boot官网展示的归属信息](https://jcodenest-oss.oss-cn-shanghai.aliyuncs.com/images/image-20250927184105447.png)

## 二、基本介绍

Spring Boot 是 Spring 全家桶中的子项目，专注于简化 Spring 框架的使用，减少繁重配置，已成为 Java 后端开发的标准化框架。它提供多种技术组件的启动器（**Starters**），开发者仅需配置必要参数，Spring Boot 即可自动处理剩余部分，从而快速构建基于 Spring 生态的应用。

Spring Boot 支持创建<u>传统 WAR 包应用</u>，也可生成<u>独立的可执行 JAR 包</u>，无需外部 Servlet 容器（如 Tomcat）。通过 `java -jar` 命令即可启动。从 Spring Boot 3.0 开始，它还支持 [GraalVM 原生镜像](https://docs.spring.io/spring-boot/reference/packaging/native-image/index.html)，进一步提升性能和启动速度。

## 三、核心思想

Spring Boot 的核心设计范式是 <u>**“约定优于配置”（Convention over Configuration）**</u>。这一范式旨在<u>减少开发者手动配置的数量</u>，通过以下方式实现：

- 提供推荐的默认配置参数，通常来说默认配置就足以应对大部分常规业务场景。
- 仅要求开发者定义约定之外的自定义参数。

若默认配置满足需求，则无需额外干预；否则，可轻松覆盖。这显著降低了配置负担。在 Spring Boot 中，这一思想体现在默认配置文件、格式和自动配置机制中，例如默认值注入或最小化个性化设置。

### 四、组件关系

Spring Boot、Spring MVC 和 Spring 框架之间存在紧密依赖关系。<u>Spring Boot 并非取代 Spring MVC 或核心 Spring，而是对其进行封装和简化</u>。

具体而言，`spring-boot-starter-web` 依赖 `spring-webmvc`，后者又依赖 `spring-beans` 和 `spring-core` 等底层组件。Spring 框架始终是基础层。



此外，微服务框架 Spring Cloud 构建于 Spring Boot 之上，无法脱离 Spring 生态独立存在。Spring Boot、Spring Cloud 等框架的整体依赖关系如下：

<img src="https://jcodenest-oss.oss-cn-shanghai.aliyuncs.com/images/image-20250927190019399.png" alt="image-20250927190019399" style="zoom:50%;" />



## 五、基本特性

Spring Boo t引入多项创新特性，提升开发和部署效率。以下是其关键特性：

1. **独立运行**：Spring Boot 内嵌 Servle t容器（如 Tomcat、Jetty 或 Undertow），<u>允许应用打包为单一可执行 JAR 包，所有依赖均包含其中</u>。通过 `java -jar` 命令即可运行，无需外部容器。这改变了传统 Java 应用的部署模式。更多部署细节可参考 [打包部署] 章节。
2. **简化配置**：传统 Spring 应用涉及大量依赖和参数配置。<u>Spring Boot 通过 Starters（如 `spring-boot-starter-web`）一站式引入所需依赖，并提供默认实现</u>。例如，引入 Web Starter 即可启用 Spring Web 功能，无需额外配置。这极大降低了技术门槛。
3. **自动配置**：<u>Spring Boot 根据类路径和上下文自动推断并配置组件</u>。例如，若检测到 HikariCP 连接池依赖且无自定义配置，则自动启用它；若存在其他配置，则放弃默认。官方 Starters 覆盖主流技术，第三方如 MyBatis 也提供兼容 Starter。自定义覆盖支持复杂需求。
4. **无代码生成和无需XML配置**：配置<u>通过条件注解（如 `@EnableAutoConfiguration`）实现，而非代码生成或 XML</u>。运行时根据环境动态应用配置。
5. **生产级特性**：包括<u>端点监控、健康检查、指标收集</u>等，支持生产环境下的应用管理和交互。

## 六、核心模块

Spring Boot 由多个核心模块组成，各司其职。以下是十大主要模块：

1. **spring-boot**：框架主模块，提供应用启动主类、上下文刷新、嵌入式 Servlet 容器（如 Tomcat）、外部化配置和日志支持。
2. **spring-boot-autoconfigure**：启用自动配置，通过 `@EnableAutoConfiguration` 注解根据类路径决定配置内容。
3. **spring-boot-starters**：Starters 基础模块，提供一站式依赖管理，如 `spring-boot-starter-web` 引入 Web 相关组件。
4. **spring-boot-cli**：命令行工具，支持 Groovy 应用快速创建和运行。
5. **spring-boot-actuator**：监控模块，提供健康、环境和 Bean 端点，用于应用交互和监控。
6. **spring-boot-actuator-autoconfigure**：为 Actuator 提供自动配置。
7. **spring-boot-test**：测试模块，包含单元测试组件和注解。
8. **spring-boot-test-autoconfigure**：为测试模块提供自动配置。
9. **spring-boot-loader**：支持构建可执行 JAR 包，通常与 Maven/Gradle 插件结合使用。
10. **spring-boot-devtools**：开发者工具，提升开发效率，如代码修改后自动重启。限于本地环境，生产时自动禁用。

## 总结

你只需要记住，**Spring Boot 通过约定优于配置的核心思想，简化了 Spring 生态的使用，使开发者专注于业务逻辑而非配置细节**。其独立运行、自动配置等特性，使其在现代 Java 开发中不可或缺。理解这些基础，对后续你自己封装一些业务组件也有很不错的参考价值。

