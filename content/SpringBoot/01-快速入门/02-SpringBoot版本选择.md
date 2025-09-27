---
title: Spring Boot 版本选择
summary: 快速了解 SpringBoot 的版本特性与生命周期。
date: 2025-09-27
cover: https://jcodenest-oss.oss-cn-shanghai.aliyuncs.com/images/20250927215645586.png
---

# Spring Boot 版本选择

Spring Boot 作为 Spring 生态的核心组件，维护多个版本线，每个版本处于不同的生命周期阶段。下面我将基于官方文档和最新信息，介绍 Spring Boot 的版本周期、支持版本以及环境要求，帮助你做出 informed 决策。所有数据以 2025 年 9 月 27 日为基准，最新版本为 3.5.6。

![image-20250927204256796](https://jcodenest-oss.oss-cn-shanghai.aliyuncs.com/images/image-20250927204256796.png)

## 一、版本周期

Spring Boot 项目同时维护多条版本线，这些版本使用特定代号表示其生命周期阶段，包括 GA、CURRENT、SNAPSHOT 和 PRE。这些代号反映了版本的成熟度和适用场景。

![image-20250927204411718](https://jcodenest-oss.oss-cn-shanghai.aliyuncs.com/images/image-20250927204411718.png)

1. **GA（General Availability，正式版本）** GA 表示<u>已向公众发布的稳定版本。一旦发布，该版本的内容不会再修改；任何发现的 BUG 将在后续版本中修复</u>。GA 版本号通常不带后缀，如 3.5.6 或 2.7.2（早期版本如 2.3.12.RELEASE 带有 RELEASE 标识）。在<u>生产环境中，必须优先使用 GA 版本，这些版本通过 Maven 中央仓库分发</u>。
2. **CURRENT（最新正式版本）** CURRENT 指代<u>最新的 GA 版本</u>。例如，Spring Boot 3.5.6 当前被标记为 CURRENT。 对于学习或研究，可选用 CURRENT 版本。但在生产项目中，应谨慎采用，因为新版本用户基数较小，可能存在未发现的问题。<u>建议生产环境落后 CURRENT 几个版本以确保稳定性</u>。
3. **SNAPSHOT（快照版本）** SNAPSHOT 是<u>每日构建的测试版本，包含最新变更</u>，如 4.0.0-SNAPSHOT。BUG 修复直接在当前 SNAPSHOT 中进行。该版本适合学习，但因潜在 BUG 众多，不推荐用于生产。
4. **PRE（预览版本）** PRE <u>包括里程碑（Milestone, M）版本如 4.0.0-M3 和候选发行（Release Candidate, RC）版本如 4.0.0-RC1</u>。这些版本从 M1 或 RC1 递增，发布后不修改内容。BUG 在 SNAPSHOT 中修复后发布下一 PRE。PRE 适合提前探索新特性，但不宜用于生产。

<u>SNAPSHOT 和 PRE 未发布到 Maven 中央仓库，仅在 Spring 仓库可用</u>。使用时需在 Maven 的 pom.xml 中配置仓库：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <!-- ... -->

    <repositories>
        <repository>
            <id>spring-snapshots</id>
            <url>https://repo.spring.io/snapshot</url>
            <snapshots><enabled>true</enabled></snapshots>
        </repository>
        <repository>
            <id>spring-milestones</id>
            <url>https://repo.spring.io/milestone</url>
        </repository>
    </repositories>

    <pluginRepositories>
        <pluginRepository>
            <id>spring-snapshots</id>
            <url>https://repo.spring.io/snapshot</url>
        </pluginRepository>
        <pluginRepository>
            <id>spring-milestones</id>
            <url>https://repo.spring.io/milestone</url>
        </pluginRepository>
    </pluginRepositories>

</project>
```

版本发布流程<u>从 SNAPSHOT 开始，经多个 PRE，到 GA。一旦 GA 发布，该线不再维护 SNAPSHOT 或 PRE</u>。下一版本重新从 SNAPSHOT 启动。

Spring Boot 官方 GitHub 仓库发布记录（从近到远）示例这里我们以[官方 Github 仓库](https://github.com/spring-projects/spring-boot)的 3.5.0 为例：

![image-20250927205012294](https://jcodenest-oss.oss-cn-shanghai.aliyuncs.com/images/image-20250927205012294.png)

上述展示了从预览到正式的演进过程。

## 二、支持版本

Spring Boot 的支持版本线如下。随着潜在的 Spring Boot 4.0 发布（目前处于规划阶段，路标从 2025 年 11 月开始）， 免费 OSS 支持聚焦于 3.4+ 版本，商业支持覆盖 2.7+（已延长至 2029 年）。 较低版本不再推荐使用，以避免安全漏洞。

![image-20250927205201313](https://jcodenest-oss.oss-cn-shanghai.aliyuncs.com/images/image-20250927205201313.png)

上述数据来源于[官方文档 Support](https://spring.io/projects/spring-boot#support)。 对于学习或测试，任何版本均可；<u>生产环境应避免最新版（以防未知问题）和已停止维护版</u>。内部系统若无重大 BUG，可灵活选择，但优先考虑支持版本。截止 2025 年底，3.4.x 及以下预计停止维护，而 3.5 被视为 3.x 系列的最终次要版本。

## 三、环境要求

不同 Spring Boot 版本对 Java 环境和 Servlet 容器的要求各异。以下对比最新版本线的要求（基于 3.5.6 更新）。

### 3.1 Java 开发环境要求

| Spring Boot | JDK     | Spring Framework | Maven  | Gradle                 |
| ----------- | ------- | ---------------- | ------ | ---------------------- |
| 3.5.6       | 17 ~ 24 | 6.2.7+           | 3.6.3+ | 7.6.4+, 8.4+           |
| 3.4.0       | 16 ~ 23 | 6.2.0+           | 3.6.3+ | 7.6.4+, 8.4+           |
| 3.3.0       | 17 ~ 22 | 6.1.8+           | 3.6.3+ | 7.5+, 8.x              |
| 3.2.0       | 17 ~ 21 | 6.1.1+           | 3.6.3+ | 7.5+, 8.x              |
| 3.1.0       | 17 ~ 20 | 6.0.9+           | 3.6.3+ | 7.5+, 8.x              |
| 3.0.0       | 17 ~ 19 | 6.0.2+           | 3.5+   | 7.5+                   |
| 2.7.12      | 8 ~ 20  | 5.3.27+          | 3.5+   | 6.8.x, 6.9.x, 7.x, 8.x |

Spring Boot 3.0+ 最低要求 JDK 17，并兼容更高版本如 Java 24。 Oracle Java 17+ 目前免费商用，但未来可转向 OpenJDK。Spring Framework 最低为 6.0.2+，注意底层升级。Spring Framework 6.1 OSS 支持至 2025 年 6 月。

### 3.2 Servlet 容器要求

| Spring Boot | Servlet | Tomcat   | Jetty    | Undertow |
| ----------- | ------- | -------- | -------- | -------- |
| 3.5.6       | 5.0+    | 10.1.25+ | 12.0     | 2.3      |
| 3.4.0       | 5.0+    | 10.1.25+ | 12.0     | 2.3      |
| 3.3.0       | 5.0+    | 10.1     | 12.0     | 2.3      |
| 3.2.0       | 5.0+    | 10.1     | 12.0     | 2.3      |
| 3.1.0       | 5.0+    | 10       | 11       | 2.2      |
| 3.0.0       | 5.0+    | 10       | 11       | 2.2      |
| 2.7.12      | 3.1+    | 9.0      | 9.4/10.0 | 2.0      |

Spring Boot 3.0+ 支持 Servlet 5.0+，并**从 Java EE 迁移至 Jakarta EE 9（兼容 10）。由于 Java EE 更名为 Jakarta EE，相关包名变更，升级时需评估兼容性**。

## 总结

选择 Spring Boot 版本需平衡创新与稳定性。生产环境优先 GA 支持版本，如 3.5.6，避免已 EOL 版本。定期检查官方文档以跟进更新，尤其是即将到来的 4.0 版本。