---
title: Java 8 新特性实战指南
summary: 本文介绍了Java 8 新特性的设计原则和最佳实践，包括函数式接口、Lambda表达式、Stream API、Optional类等。
date: 2025-09-20
cover: https://jcodenest-oss.oss-cn-shanghai.aliyuncs.com/images/20250921112150627.png
---

# Java 8 新特性实战指南

> JDK8 的 “新特性” 其实在 2025 年已经算不上 “新特性” 了，毕竟现在 JDK 已经发布到 JDK25 了，但是在实际工作中，JDK8 还是被广泛使用的，
> 因为它的 “新特性” 已经被广泛接受了。

Java 8 的发布标志着 Java 语言发展历程中的一个重要里程碑。这个版本不仅仅是功能的简单添加，而是对 Java 编程范式的根本性扩展。Oracle 团队在设计 Java 8 时面临的核心挑战是：如何在保持向后兼容性的前提下，为 Java 引入现代编程语言的**函数式编程能力**，以应对多核处理器时代对并行计算的需求，同时提升开发者的编程效率。

Java 8 的设计哲学可以概括为三个核心理念：

- **表达力增强**: 通过 Lambda 表达式让代码更加简洁和可读
- **数据处理能力提升**: 通过 Stream API 实现声明式编程
- **类型安全的增强**: 通过 Optional 和新的 Date-Time API 减少常见的编程错误

## 一、函数式接口

### 1.1 函数式接口的核心概念与设计原理

函数式接口（Functional Interface）是 Java 8 函数式编程的理论基础。从技术角度来看，函数式接口是**有且仅有一个抽象方法**的接口。这个设计看似简单，却蕴含着深刻的设计智慧：它为 Lambda 表达式提供了**类型推断的基础**，同时保证了与既有代码的完美兼容。

```java
// 典型的函数式接口定义
@FunctionalInterface
public interface UserProcessor {

    // 函数式接口的核心：只有一个抽象方法
    void process(User user);
    
    // 可以有默认方法和静态方法
    default void logProcess(User user) {
        System.out.println("Processing user: " + user.getName());
    }
    
    static UserProcessor createLogger() {
        return user -> System.out.println("Log: " + user);
    }
}
```

> `@FunctionalInterface` 注解虽然不是强制性的，但它提供了编译时验证，确保接口确实符合函数式接口的定义。这种设计体现了 Java 语言 "显式优于隐式" 的设计原则。

### 1.2 Java 8 内置函数式接口

Java 8 在 `java.util.function` 包中提供了丰富的内置函数式接口，这些接口构成了函数式编程的基础工具集：

#### 1.2.1 `Predicate<T>` - 断言型接口

`java.util.function.Predicate` 函数式接口用于代表一个参数的谓词（布尔值函数），提供了一个 `boolean test(T t)` 用于对输入参数进行测试并返回一个布尔值。

接口源码提供了如下几个方法:

- `boolean test(T t)`: 对输入参数进行测试，返回一个布尔值。
- `Predicate<T> and(Predicate<? super T> other)`: (default) 组合两个 Predicate，返回一个新的 Predicate，只有当两个 Predicate 都为 true 时才为 true。
- `Predicate<T> negate()`: (default) 返回一个新的 Predicate，它是当前 Predicate 的逻辑非。
- `Predicate<T> or(Predicate<? super T> other)`: (default) 组合两个 Predicate，返回一个新的 Predicate，只要有一个 Predicate 为 true 就为 true。
- `<T> Predicate<T> isEqual(Object targetRef)`: (static) 创建一个 Predicate，用于测试对象是否等于指定的引用。
- `<T> Predicate<T> not(Predicate<? super T> target)`: (static) 创建一个 Predicate，用于测试对象是否不等于指定的 Predicate。

使用示例:

```java
public class PredicateAdvancedExample {
    
    // 组合条件判断的强大能力
    public static List<Employee> filterEmployees(List<Employee> employees) {
        // 使用 Predicate 接口的方法创建 Predicate 实例
        // 特点：输入参数结果都是一个布尔值
        Predicate<Employee> highSalary = emp -> emp.getSalary() > 50000;
        Predicate<Employee> youngAge = emp -> emp.getAge() < 35;
        Predicate<Employee> techDepartment = emp -> "Technology".equals(emp.getDepartment());
        
        // 使用组合操作创建复杂条件
        Predicate<Employee> targetEmployee = highSalary
            .and(youngAge) // 必须：年龄小于 35 岁
            .and(techDepartment); // 必须：部门为 Technology
            
        return employees.stream()
            .filter(targetEmployee) // 过滤出符合条件的员工，即 “年龄小于 35 岁” + “部门为 Technology”
            .collect(Collectors.toList());
    }
    
    // 动态条件构建
    public static Predicate<Employee> buildDynamicFilter(Map<String, Object> criteria) {
        Predicate<Employee> combinedPredicate = emp -> true;
        
        if (criteria.containsKey("minSalary")) {
            // 必须：薪资大于等于 minSalary
            combinedPredicate = combinedPredicate.and(
                emp -> emp.getSalary() >= (Double) criteria.get("minSalary")
            );
        }
        
        if (criteria.containsKey("department")) {
            // 必须：部门等于 department
            combinedPredicate = combinedPredicate.and(
                emp -> emp.getDepartment().equals(criteria.get("department"))
            );
        }
        
        // 结果：返回一个新的 Predicate，它是所有条件的组合
        return combinedPredicate;
    }
}
```

#### 1.2.2 `Function<T,R>` - 转换型接口

`java.util.function.Function` 接口的核心价值在于提供了一种类型安全的转换机制，它的组合能力使得复杂的数据转换变得优雅和可维护。

接口源码包含如下方法:

- `R apply(T t)`: 对输入参数进行转换，返回一个结果。
- `<V> Function<V, R> compose(Function<? super V, ? extends T> before)`: (default) 组合两个 Function，返回一个新的 Function，
先执行 before 函数，再执行当前 Function。如果对任何一个函数的评估发生了异常, 会将其转移到 `compose` 方法的调用者。
- `<V> Function<T, V> andThen(Function<? super R, ? extends V> after)`: (default) 组合两个 Function，返回一个新的 Function，
先执行当前 Function，再执行 after 函数。如果对任何一个函数的评估发生了异常, 会将其转移到 `andThen` 方法的调用者。
- `<T> Function<T, T> identity()`: (static) 返回一个新的 Function，它是一个恒等函数，即输入参数和输出参数相同。

```java
public class FunctionAdvancedExample {
    
    // 函数组合
    public static Function<String, String> createTextProcessor() {
        // 将字符串先去空格，再转换为大写，最后添加前缀
        Function<String, String> trimmer = String::trim;
        Function<String, String> upperCase = String::toUpperCase;
        Function<String, String> addPrefix = s -> "PROCESSED: " + s;
        
        // 函数链式组合
        return trimmer.andThen(upperCase).andThen(addPrefix);
    }
    
    // 映射转换的高级用法
    public static <T, R> List<R> transformList(List<T> source, Function<T, R> transformer) {
        return source.stream()
            .map(transformer) // 对列表中的每个元素应用转换函数
            .collect(Collectors.toList());
    }
}
```

#### 1.2.3 `Consumer<T>和Supplier<T>` - 消费与生产模式

这两个接口体现了函数式编程中的**消费者-生产者模式**，在实际开发中具有广泛的应用价值。

`java.util.function.Consumer<T>` 接口的核心价值在于提供了一种类型安全的消费机制，它接收单个参数并返回 `void`，与大多数其他函数式接口不同，
它的主要价值在于其**消费**能力，而不是**生产**能力。

看下 `Consumer<T>` 源码：

```java
@FunctionalInterface
public interface Consumer<T> {

    /**
     * 对给定的参数进行消费操作。
     *
     * @param t 要消费的参数
     */
    void accept(T t);

    /**
     * 该方法用于创建一个新的 `Consumer`，它先执行当前 `Consumer` 的 `accept` 方法，
     * 然后执行 `after` 操作。如果执行任何一个操作抛出异常，异常将被中继到组合操作的调用者。
     *
     * @param after 此 `Consumer` 执行后要执行的 `Consumer`
     * @return 一个新的 `Consumer`，它先执行当前 `Consumer` 的 `accept` 方法，
     * 然后执行 `after` 操作。如果执行任何一个操作抛出异常，异常将被中继到组合操作的调用者。
     * @throws NullPointerException 如果 {@code after} 为 `null`
     */
    default Consumer<T> andThen(Consumer<? super T> after) {
        Objects.requireNonNull(after);
        return (T t) -> { accept(t); after.accept(t); };
    }
}
```

我们再看看 `java.util.function.Supplier<T>`，该接口的核心价值在于提供了一种类型安全的生产机制，它不接收参数但返回一个结果。

看一下它的源码：

```java
@FunctionalInterface
public interface Supplier<T> {

    /**
     * 获取一个结果。
     *
     * @return 一个结果
     */
    T get();
}
```

可以看到 `Consumer<T>` 接口的 `accept` 方法接收一个参数 `T t`，而 `Supplier<T>` 接口的 `get` 方法不接收参数但返回一个结果 `T`。

> Node: `Consumer<T>` 接口和 `Supplier<T>` 接口总结：
> - `Consumer<T>` 接口的 `accept` 方法接收一个参数 `T t`，并对其进行消费操作，返回 `void`。主要用于**消费**数据，例如打印、写入文件等。
> - `Supplier<T>` 接口的 `get` 方法不接收参数但返回一个结果 `T`。主要用于**生产**数据，例如从数据库查询、创建对象等。

使用示例：

```java
public class ConsumerSupplierExample {
    
    // Consumer 的链式处理能力
    public static void processUsers(List<User> users) {
        Consumer<User> validator = user -> {
            // 消费行为：验证用户邮箱是否为空
            if (user.getEmail() == null || user.getEmail().isEmpty()) {
                throw new IllegalArgumentException("Email cannot be empty");
            }
        };
        
        // 消费行为：打印用户信息
        Consumer<User> logger = user -> System.out.println("Processing user: " + user.getName());
            
        // 消费行为：将用户保存到数据库
        Consumer<User> persister = user -> userRepository.save(user);
        
        // 组合多个处理步骤：先验证、再打印、最后保存
        Consumer<User> fullProcessor = validator.andThen(logger).andThen(persister);
        
        users.forEach(fullProcessor);
    }
    
    // Supplier 的延迟计算特性：只有在真正需要时才计算资源，这里用于获取当前时间
    private static final Supplier<LocalDateTime> currentTime = LocalDateTime::now;
    
    public static void demonstrateLazyEvaluation() {
        // 只有在真正需要时才计算，注意这里的动作在调用 get 方法时才执行
        Supplier<ExpensiveResource> resourceSupplier = () -> {
            System.out.println("Creating expensive resource...");
            return new ExpensiveResource();
        };
        
        // 条件性创建资源
        if (needResource()) {
            // 只有在 needResource 方法返回 true 时，明确调用了 get 方法，才会创建资源
            ExpensiveResource resource = resourceSupplier.get();
            // 使用资源
            resource.doSomething();
        }
    }
}
```

### 1.3 自定义函数式接口

在实际项目中，合理设计自定义函数式接口能够显著提升代码的可读性和可维护性。创建自定义函数式接口我们只需要遵守函数式接口规范即可：

1. 接口只定义一个抽象方法，这是函数式接口的核心要求。
2. 接口可以包含默认方法和静态方法，这些方法不是抽象的，不会影响函数式接口的定义。
3. 接口可以使用 `@FunctionalInterface` 注解来显式声明它是一个函数式接口，这是可选的，但推荐使用，因为它可以帮助编译器检测错误。

使用自定义函数式接口的示例：

```java
// 业务特定的函数式接口设计
@FunctionalInterface // 显式声明这是一个函数式接口
public interface ValidationRule<T> {
    
    /**
     * 验证给定的对象是否符合规则。
     *
     * @param object 要验证的对象
     * @return 如果对象符合规则，则返回 {@code ValidationResult.success()}；
     *         否则返回 {@code ValidationResult.error()} 包含错误消息
     */
    ValidationResult validate(T object);
    
    /**
     * 组合两个验证规则，只有当当前规则和其他规则都通过时，才返回成功。
     *
     * @param other 要组合的其他验证规则
     * @return 一个新的验证规则，它是当前规则和其他规则的组合
     */
    default ValidationRule<T> and(ValidationRule<T> other) {
        return obj -> {
            ValidationResult first = this.validate(obj);
            if (!first.isValid()) {
                return first;
            }
            return other.validate(obj);
        };
    }
}

// 业务逻辑中使用验证规则
public class ValidationExample {
    
    // 构建验证规则库
    public static final ValidationRule<User> NAME_VALIDATION = 
        user -> user.getName() != null && !user.getName().trim().isEmpty()
            ? ValidationResult.success()
            : ValidationResult.error("Name cannot be empty");
    
    public static final ValidationRule<User> EMAIL_VALIDATION = 
        user -> user.getEmail() != null && user.getEmail().contains("@")
            ? ValidationResult.success()
            : ValidationResult.error("Invalid email format");
    
    public static final ValidationRule<User> AGE_VALIDATION = 
        user -> user.getAge() >= 18 && user.getAge() <= 120
            ? ValidationResult.success()
            : ValidationResult.error("Age must be between 18 and 120");
    
    // 使用组合验证：链式验证姓名、邮箱和年龄
    public static ValidationResult validateUser(User user) {
        return NAME_VALIDATION
            .and(EMAIL_VALIDATION)
            .and(AGE_VALIDATION)
            .validate(user);
    }
}
```

## 二、Lambda表达式

### 2.1 Lambda表达式的语法

Lambda 表达式的设计目标是提供一种简洁的方式来表示**匿名函数**。其语法结构 `(parameters) -> expression` 看似简单，但包含了丰富的语法变体和类型推断机制：

```java
public class LambdaSyntaxMastery {
    
    public static void demonstrateAllSyntaxVariations() {
        List<String> words = Arrays.asList("hello", "world", "java", "lambda");
        
        // 1. 无参数Lambda
        Runnable simpleTask = () -> System.out.println("Task executed");
        
        // 2. 单参数Lambda（可省略括号），自动类型推断
        words.forEach(word -> System.out.println(word.toUpperCase()));
        
        // 3. 多参数Lambda（需要括号），自动类型推断
        BiFunction<String, String, String> concatenator = (first, second) -> first + " " + second;
        
        // 4. 代码块形式的Lambda（需要大括号），自动类型推断
        Predicate<String> complexValidator = word -> {
            if (word == null || word.isEmpty()) {
                return false;
            }
            return word.length() > 3 && word.chars().allMatch(Character::isLetter);
        };
        
        // 5. 显式类型声明，明确参数类型，但是在实际开发中，通常不需要显式声明参数类型，因为编译器可以根据上下文自动推断
        BiPredicate<String, Integer> lengthMatcher = (String str, Integer length) -> str.length() == length;
    }
}
```

### 2.2 方法引用 - Lambda的进一步简化

方法引用是 Lambda 表达式的**语法糖**，它提供了四种不同的引用方式，每种都对应特定的使用场景：

> TIP: 语法糖
> 所谓语法糖，是指使用更加方便、简洁的语法来实现相同的功能。但是在编译阶段，会被转换为等价的字节码，因此不会影响程序的运行时性能。

```java
public class MethodReferenceAdvanced {
    
    public static void demonstrateAllMethodReferenceTypes() {
        List<String> names = Arrays.asList("Alice", "Bob", "Charlie");
        
        // 1. 静态方法引用 - ClassName::methodName
        names.stream()
            .map(String::valueOf)  // 等价于 name -> String.valueOf(name)
            .forEach(System.out::println);
        
        // 2. 实例方法引用 - object::methodName
        StringProcessor processor = new StringProcessor();
        names.stream()
            .map(processor::process)  // 等价于 name -> processor.process(name)
            .collect(Collectors.toList());
        
        // 3. 特定类型的任意对象的实例方法引用 - ClassName::methodName
        names.stream()
            .map(String::toUpperCase)  // 等价于 name -> name.toUpperCase()
            .collect(Collectors.toList());
        
        // 4. 构造器引用 - ClassName::new
        List<User> users = names.stream()
            .map(User::new)  // 等价于 name -> new User(name)
            .collect(Collectors.toList());
    }
}
```

### 2.3 变量捕获与作用域规则

Lambda 表达式最大的特点之一是它不仅仅是一段匿名函数，还能**捕获其所在上下文的变量**，从而形成**闭包（Closure）**。理解变量捕获的机制是掌握 
Lambda 的关键，否则很容易在写代码时遇到 “编译错误” 或 “不符合预期的行为”。

> 什么是变量捕获？
> - 捕获（Capture）：指 Lambda 内部使用了定义在它外部作用域中的变量。
> - 捕获后，Lambda 表达式会 “记住” 这些变量，即使在方法执行完后，Lambda 仍然可以使用它们。
> 这就是 **闭包** 的概念：函数和它所绑定的环境一起存在。

在 Java 里，Lambda 的捕获有严格的规则：

1. **实例变量（this 引用下的字段）**: 直接访问，和普通方法中访问一样。没有限制，不需要是 final。
2. **静态变量**: 可以直接访问。也没有限制。
3. **局部变量（方法内部定义的变量）**: 只能捕获 final 或 effectively final（实际上不再被修改）的变量。一旦 Lambda 捕获了某个局部变量，就不能
   在外部方法里再修改这个变量，否则会编译报错。这是因为局部变量实际存储在**栈**上，而 Lambda 可能在方法结束后依然存在，因此 Java 会在编译时
   把它们 “拷贝” 到 Lambda 中，这就要求变量不可变。

变量捕获规则示例：

```java
public class LambdaVariableCapture {

    private int instanceVariable = 10; // 实例变量（this 引用下的字段），直接访问，和普通方法中访问一样。没有限制，不需要是 final。
    private static int staticVariable = 20; // 静态变量，可以直接访问。也没有限制。

    public void demonstrateVariableCapture() {
        // 局部变量（方法内部定义的变量）
        int localVariable = 30;  // effectively final（实际上不再被修改）的变量
        final int finalVariable = 40; // final 局部变量，捕获后不能再修改

        Supplier<Integer> calculator = () -> {
            int result = instanceVariable;   // 捕获实例变量
            result += staticVariable;        // 捕获静态变量
            result += localVariable;         // 捕获局部变量（effectively final）
            result += finalVariable;         // 捕获 final 局部变量
            return result;
        };

        // localVariable = 35; // ❌ 编译错误：破坏 effectively final 规则

        System.out.println("Result: " + calculator.get()); // 输出 100
    }
}
```

> 为什么局部变量必须是 final 或 effectively final？
> 局部变量分配在栈上，方法结束后会被销毁。但 Lambda 可能会在方法返回后仍被使用（如放到集合中）。Java 编译器会 “拷贝” 这些变量到 Lambda 内部，
> 因此必须确保它们不会再被修改，否则会引起不可预测的行为。

### 2.4 Lambda表达式的性能考量与最佳实践

理解 Lambda 表达式的性能特征对于编写高效代码至关重要：

```java
public class LambdaPerformanceOptimization {
    
    // 避免在循环中创建 Lambda（性能反模式）
    public void poorPerformanceExample(List<String> items) {
        for (String item : items) {
            // 每次迭代都创建新的 Lambda 对象
            Predicate<String> filter = s -> s.startsWith(item);
            // 使用 filter...
        }
    }
    
    // 优化版本：重用 Lambda 表达式
    private static final Predicate<String> NON_EMPTY_PREDICATE = s -> s != null && !s.isEmpty();
    public void optimizedExample(List<String> items) {
        List<String> filtered = items.stream()
            .filter(NON_EMPTY_PREDICATE)  // 重用预定义的 Lambda
            .collect(Collectors.toList());
    }
    
    // 方法引用 vs Lambda 表达式的性能比较
    public void performanceComparison(List<String> words) {
        // 方法引用（通常性能更好）
        words.stream()
            .map(String::toUpperCase)
            .count();
        
        // Lambda表达式（功能相同，但可能性能略差，因为每次调用都创建新的对象，而方法引用则是直接引用已存在的方法，避免了对象创建的开销）
        words.stream()
            .map(s -> s.toUpperCase())
            .count();
    }
}
```

## 三、Stream API

### 3.1 Stream API的设计理念与核心概念

Stream API 的设计灵感来自于函数式编程语言中的**集合处理模型**。它提供了一种**声明式编程范式**，让开发者专注于描述 “做什么”，而不是 “怎么做”。

核心理念：

1. **数据源（Source）**：可以是集合、数组、I/O 通道等。
2. **中间操作（Intermediate Operations）**：惰性求值，返回新的 Stream，可链式调用。
3. **终端操作（Terminal Operations）**：触发实际计算，返回结果或副作用。

Stream 的三大组件示例：

```java
public void demonstrateStreamComponents() {
    List<Transaction> transactions = getTransactions();

    // 1. 数据源，即从集合、数组、I/O 通道等创建的 Stream。
    Stream<Transaction> sourceStream = transactions.stream();

    // 2. 中间操作（惰性），所谓惰性求值，是指中间操作不会立即执行，只有在终端操作时才会触发计算。
    Stream<Transaction> filteredStream = sourceStream
        .filter(t -> t.getAmount() > 1000)                  // 过滤
        .sorted(Comparator.comparing(Transaction::getDate)) // 排序
        .distinct();                                        // 去重

    // 3. 终端操作（触发计算），终端操作会触发 Stream 管道的执行，返回结果或副作用。
    List<Transaction> result = filteredStream.collect(Collectors.toList());
}
```

> 关键点：**只有调用终端操作时，才会触发整个管道的执行**。

### 3.2 中间操作的应用与性能优化

中间操作是 Stream API 的核心，用于逐步加工数据。常见操作分为：

- **筛选型**：filter (过滤)、distinct (去重)
- **映射型**：map (转换)、flatMap (转换并扁平化)
- **排序型**：sorted (排序)
- **限制型**：limit (截取前N个元素)、skip (跳过前N个元素)
- **组合优化**：短路操作、条件合并

示例：组合过滤

```java
return orders.stream()
    .filter(order -> order.getTotalAmount() > 1000)
    .filter(order -> order.getOrderDate().isAfter(LocalDateTime.now().minusDays(30)))
    .filter(order -> order.getStatus() != OrderStatus.CANCELLED)
    .collect(Collectors.toList());
```

> 建议用 **复合 Predicate（and、or）** 提升可读性。

示例：map 与 flatMap

```java
// 计算各部门平均工资
employees.stream()
    .collect(Collectors.groupingBy(
        Employee::getDepartment, // 根据部门分组
        Collectors.averagingDouble(Employee::getSalary) // 计算每个部门的平均工资
    ));

// 扁平化员工技能集合
employees.stream()
    .flatMap(emp -> emp.getSkills().stream()) // 将每个员工的技能集合转换为一个流
    .distinct()  // 去重
    .sorted()    // 排序
    //.toList();   // 收集结果到列表(扁平化)
    // 上面的直接写 .toList() 是 JDK 9 引入的方法，之前需要用 Collectors.toList() 收集
    .collect(Collectors.toList()); // 收集结果到列表(扁平化)
```

示例：分页

```java
products.stream()
    .sorted(Comparator.comparing(Product::getName))
    .skip(page * pageSize)  // 跳过前几页
    .limit(pageSize)        // 取一页
    .toList();
```

> 常见于 **内存分页**（不建议用于大规模数据，数据库分页更优）。

### 3.3 终端操作与数据收集

终端操作负责触发流的执行，常见操作包括：

- **聚合**：count (统计元素数量)、sum (求和)、max (最大值)、min (最小值)、summaryStatistics (统计摘要信息)
- **收集**：collect（配合 Collectors）
- **匹配/查找**：anyMatch (是否存在满足条件的元素)、allMatch (是否所有元素都满足条件)、findFirst (返回第一个元素)、findAny (返回任意一个元素)
- **副作用**：forEach (消费元素)、forEachOrdered (有序消费元素)

示例：统计分析

```java
DoubleSummaryStatistics stats = orders.stream()
    .filter(o -> o.getStatus() == OrderStatus.COMPLETED) // 只统计已完成订单
    .mapToDouble(Order::getTotalAmount) // 提取订单金额
    .summaryStatistics(); // 计算统计摘要信息, 包含元素数量、总和、平均值、最大值、最小值

System.out.printf("count=%d, sum=%.2f, avg=%.2f%n", stats.getCount(), stats.getSum(), stats.getAverage());
```

示例：复杂分组 (实现 多级分组 + 聚合)

```java
orders.stream()
    .collect(Collectors.groupingBy(
        Order::getRegion, // 根据订单区域分组
        Collectors.groupingBy(Order::getStatus, Collectors.counting()) // 再根据订单状态分组, 统计每个区域每个状态的订单数量
    ));
```

示例：分区 (返回 `Map<Boolean, List<T>>`，适合二分类场景)

```java
employees.stream()
    .collect(Collectors.partitioningBy(emp -> emp.getPerformanceRating() >= 4.0));
```

示例：字符串拼接

```java
employees.stream()
    .map(emp -> emp.getName() + " - " + emp.getDepartment())
    .collect(Collectors.joining("\n", "Employee Report:\n", "\n--- End ---"));
```

### 3.4 并行 Stream 的应用与性能调优

并行流利用 `ForkJoinPool` 在多核上自动分治，适合 CPU 密集型 + 大数据量 场景。

适用条件:

1. 数据量较大（> 1w 元素）
2. 操作计算密集（非 I/O）
3. 数据结构易分割（如 ArrayList、数组）

示例：性能对比

```java
long serialTime = measure(() -> numbers.stream()
    .mapToLong(this::expensiveCalculation).sum());

long parallelTime = measure(() -> numbers.parallelStream()
    .mapToLong(this::expensiveCalculation).sum());

System.out.printf("Serial=%dms, Parallel=%dms, Speedup=%.2fx%n",
    serialTime, parallelTime, (double) serialTime / parallelTime);
```

> 注意：不要盲目使用并行流，小数据量反而可能更慢。

示例：自定义线程池

```java
ForkJoinPool pool = new ForkJoinPool(8); // 自定义线程池大小为 8 个线程
List<T> result = pool.submit(() ->
    data.parallelStream().map(processor).toList() // 并行处理, 结果收集到列表
).get();
```

> 默认使用全局 `ForkJoinPool.commonPool()`，可通过自定义线程池隔离业务。

常见陷阱:

```java
// ❌ 非线程安全：数据竞争
List<String> result = new ArrayList<>();
words.parallelStream().forEach(result::add);

// ✅ 正确：使用 collect
List<String> safeResult = words.parallelStream()
    .map(String::toUpperCase)
    .toList();
```

## 四、Optional

### 4.1 Optional 的设计哲学与核心价值

在 Java 8 之前，`null` 一直是开发者的梦魇。Tony Hoare 曾称其为 **“十亿美元的错误”**：因为 `null` 导致了无数次 `NullPointerException`。

`Optional<T>` 的引入并不是为了取代所有 `null`，而是为了在 **方法返回值层面** 提供一种 **显式的缺失语义**。

- **传统 null 检查**：开发者需要不断写 `if (obj != null)`，容易遗漏，代码冗余。
- **Optional 思维**：把 “可能不存在的值” 用类型系统表达出来，强制调用者去思考 “值是否存在”。

> 核心价值：
> 1. **显式语义** —— 代码可读性更好。
> 2. **减少空指针风险** —— 在编译期推动开发者处理缺失情况。
> 3. **函数式风格** —— 支持链式处理，避免嵌套 `if`。

示例（传统 vs Optional）：

```java
// 传统写法：层层 null 检查
public String getCustomerCityTraditional(Long customerId) {
    Customer customer = customerRepository.findById(customerId);
    if (customer != null) {
        Address address = customer.getAddress();
        if (address != null) {
            return address.getCity();
        }
    }
    return "Unknown";
}

// Optional 写法：链式处理更优雅
public String getCustomerCityWithOptional(Long customerId) {
    return customerRepository.findByIdOptional(customerId)
        .map(Customer::getAddress)
        .map(Address::getCity)
        .orElse("Unknown");
}
```

### 4.2 Optional 的核心方法与应用模式

`Optional` 提供了一系列方法来处理 “有值 / 无值” 的场景，大体可以分为：

- **存在性判断**：`isPresent()` / `ifPresent()` / `ifPresentOrElse()`
- **值获取**：`get()`（⚠️ 慎用）、`orElse()`、`orElseGet()`、`orElseThrow()`
- **值转换**：`map()`、`flatMap()`、`filter()`
- **组合与降级**：`or()`、`stream()`（Java 9+）

示例：链式转换与过滤

```java
public Optional<UserProfile> buildUserProfile(Long userId) {
    return userService.findById(userId)          // Optional<User>
        .filter(User::isActive)                  // 过滤非活跃用户
        .map(this::enrichUserData)               // 转换为富数据
        .flatMap(this::validateUserData)         // 可能失败 → Optional
        .map(this::buildProfile);                // 构建结果
}
```

示例：复杂条件处理

```java
public String determineUserStatus(Long userId) {
    return userService.findById(userId) // Optional<User>
        .map(user -> {
            if (user.isPremium()) return "Premium";
            if (user.getLastLoginDate().isAfter(LocalDateTime.now().minusDays(30)))
                return "Active";
            return "Inactive";
        })
        .orElse("User Not Found"); // 如果 Optional 为空, 返回默认值 "User Not Found"
}
```

示例：与异常处理结合

```java
public Optional<Result> processSafely(String input) {
    return Optional.ofNullable(input) // 要求 input 不能为 null, 否则抛出 NullPointerException
        .filter(s -> !s.isEmpty())
        .map(this::parseInput)
        .flatMap(this::validateParsedData);
}
```

示例：多个 Optional 组合（组合逻辑往往仍需手动展开）

```java
public Optional<OrderSummary> createOrderSummary(Long orderId) {
    Optional<Order> order = orderService.findById(orderId);
    Optional<Customer> customer = order.flatMap(o -> customerService.findById(o.getCustomerId()));
    Optional<Shipping> shipping = order.flatMap(o -> shippingService.findByOrderId(o.getId()));
    
    // 手动展开 Optional 组合
    if (order.isPresent() && customer.isPresent() && shipping.isPresent()) {
        return Optional.of(new OrderSummary(order.get(), customer.get(), shipping.get()));
    }
    return Optional.empty();
}
```

### 4.3 Optional 的最佳实践与反模式

最佳实践：

1. ✅ 用于方法返回值 —— 表达 “结果可能不存在”。
2. ✅ 与函数式风格结合 —— 避免层层 `null` 检查。
3. ✅ 用在业务逻辑链中 —— 可以和 `Stream` 风格配合。
4. ✅ 用在值对象之外 —— 避免在实体类字段上使用 `Optional`。

反模式:

- ❌ 作为方法参数：会让 API 使用者困惑。
- ❌ 滥用 `Optional.get()`：这和直接用 null 没区别。
- ❌ 类字段用 `Optional`：对象本身已经能表达是否有值，没必要再套一层。

推荐 vs 不推荐：

| 场景    | 推荐做法             | 反模式 |
|-------|------------------| -- |
| 方法返回值 | `Optional<User>` | 直接返回 `null` |
| 方法参数  | `User user` / `@Nullable`   | `Optional<User> userOpt` |
| 类字段   | `private String middleName;` | `private Optional<String> middleName;` |
| 获取值   | `opt.orElse("default")` | `opt.get()` |

### 4.4 Optional 的性能考量与优化策略

`Optional` 并不是零成本的：

- 每次调用 `ofNullable` / `map` 都会创建额外对象。
- 在性能敏感场景（如百万次循环）中，可能带来开销。

建议1: **小心滥用**，在性能关键路径中，传统 `null` 检查更快。

```java
// 传统方式
if (input != null) { return input.trim(); }
return "DEFAULT";

// Optional 方式（更优雅，但有对象开销）
return Optional.ofNullable(input)
    .map(String::trim)
    .orElse("DEFAULT");
```

建议2: **避免不必要的包装**，先做快速校验，再决定是否创建 `Optional`。

建议3: **缓存 Optional**，避免重复创建。

```java
private static final Optional<String> EMPTY_STRING = Optional.empty();
```

建议4: **面向接口**，在 API 层面返回 Optional（表达语义），在内部实现中，仍可用传统 null 优化性能。

## 五、日期时间API

Java 8 引入的 **JSR-310 日期时间 API** 是一次彻底的革新，相比旧的 `Date` / `Calendar` 体系，它具备以下核心优势：

- **不可变性（Immutability）**：所有类型均为不可变对象，天然线程安全。
- **清晰的职责划分**：`LocalDate` 处理日期，`LocalTime` 处理时间，`Instant` 表示时间戳，`ZonedDateTime` 管理时区。
- **丰富的计算与格式化能力**：内置工具类如 `Period`、`Duration`、`TemporalAdjusters`，支持复杂业务计算。
- **国际化与扩展性**：内置多语言支持，允许构建适配全球用户的应用。

### 5.1 核心类型与设计理念

- `LocalDate`：日期（年/月/日），无时间。
- `LocalTime`：时间（时/分/秒/纳秒），无日期。
- `LocalDateTime`：日期 + 时间，常用于业务层逻辑。
- `ZonedDateTime`：日期 + 时间 + 时区，适合跨地区应用。
- `Instant`：时间戳（UTC），常用于存储与比较。
- `Duration` & `Period`：前者表示基于时间的间隔，后者表示基于日期的间隔。

> 最佳实践：业务逻辑使用 `LocalDateTime`，存储与日志记录使用 `Instant`，跨时区场景使用 `ZonedDateTime`。

### 5.2 日期时间的创建与解析

工厂方法创建:

```java
LocalDate date = LocalDate.of(2025, 9, 21);
LocalTime time = LocalTime.of(14, 30, 0);
LocalDateTime dateTime = LocalDateTime.of(date, time);
```

字符串解析与自定义格式:

```java
LocalDate parsed = LocalDate.parse("2025-09-21");

DateTimeFormatter f = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss");
LocalDateTime customParsed = LocalDateTime.parse("21-09-2025 14:30:00", f);
```

智能调整（TemporalAdjusters）:

```java
// 下一个周一
LocalDate nextMonday = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
```

遗留 API 互操作:

```java
Date legacy = new Date();
Instant i = legacy.toInstant();
LocalDateTime modern = LocalDateTime.ofInstant(i, ZoneId.systemDefault());
```

> 经验总结：解析时尽量使用 `DateTimeFormatter`，避免默认解析器的歧义；遗留系统迁移时，先转换为 `Instant` 统一处理。

### 5.3 时区与跨地区应用

- **时区管理**：`ZoneId.systemDefault()` 获取系统时区，`ZoneId.of("Asia/Tokyo")` 指定时区。
- **跨时区转换**：

```java
ZonedDateTime utc = ZonedDateTime.of(localDateTime, ZoneId.of("UTC"));
ZonedDateTime tokyo = utc.withZoneSameInstant(ZoneId.of("Asia/Tokyo"));
```

> 经验总结：存储永远用 UTC（Instant），展示时再根据用户时区转换。这样可以避免时区不同带来的问题。

## 总结

Java 8 奠定的函数式编程基础为后续版本的发展铺平了道路。Java 9+ 中的模块系统、局部变量类型推断、记录类型等新特性都建立在 Java 8 建立的基础之上。
理解和掌握 Java 8 的设计思想，对于学习后续版本的新特性具有重要意义。