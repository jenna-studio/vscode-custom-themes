#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <memory>
#include <unordered_map>
#include <functional>
#include <optional>

// Constants
constexpr int MAX_STUDENTS = 100;
constexpr double PASS_THRESHOLD = 60.0;

namespace university {

// Enum class
enum class Department {
    ComputerScience,
    Mathematics,
    Physics,
    Engineering
};

// Struct
struct Grade {
    std::string course;
    double score;
    int credits;

    bool passed() const { return score >= PASS_THRESHOLD; }
};

// Template function
template <typename T>
T clamp(T value, T low, T high) {
    if (value < low) return low;
    if (value > high) return high;
    return value;
}

// Abstract base class
class Person {
public:
    Person(std::string name, int age)
        : name_(std::move(name)), age_(age) {}

    virtual ~Person() = default;
    virtual std::string role() const = 0;

    const std::string& name() const { return name_; }
    int age() const { return age_; }

    friend std::ostream& operator<<(std::ostream& os, const Person& p) {
        return os << p.role() << ": " << p.name_ << " (age " << p.age_ << ")";
    }

protected:
    std::string name_;
    int age_;
};

// Derived class
class Student : public Person {
public:
    Student(std::string name, int age, Department dept)
        : Person(std::move(name), age), department_(dept) {}

    std::string role() const override { return "Student"; }

    void addGrade(const std::string& course, double score, int credits) {
        double clamped = clamp(score, 0.0, 100.0);
        grades_.push_back({course, clamped, credits});
    }

    // Calculate weighted GPA
    std::optional<double> gpa() const {
        if (grades_.empty()) return std::nullopt;

        double totalPoints = 0.0;
        int totalCredits = 0;

        for (const auto& [course, score, credits] : grades_) {
            totalPoints += score * credits;
            totalCredits += credits;
        }

        return totalCredits > 0
            ? std::optional(totalPoints / totalCredits)
            : std::nullopt;
    }

    std::vector<Grade> failedCourses() const {
        std::vector<Grade> failed;
        std::copy_if(grades_.begin(), grades_.end(),
                     std::back_inserter(failed),
                     [](const Grade& g) { return !g.passed(); });
        return failed;
    }

    Department department() const { return department_; }

private:
    Department department_;
    std::vector<Grade> grades_;
};

// Class with smart pointers
class Roster {
public:
    using StudentPtr = std::shared_ptr<Student>;
    using Callback = std::function<void(const Student&)>;

    void enroll(StudentPtr student) {
        auto dept = student->department();
        students_[dept].push_back(std::move(student));
        count_++;
    }

    void forEach(Callback fn) const {
        for (const auto& [dept, students] : students_) {
            for (const auto& s : students) {
                fn(*s);
            }
        }
    }

    size_t size() const { return count_; }

    // Range-based filtering
    std::vector<StudentPtr> topStudents(double minGpa) const {
        std::vector<StudentPtr> result;
        for (const auto& [dept, students] : students_) {
            for (const auto& s : students) {
                auto avg = s->gpa();
                if (avg.has_value() && avg.value() >= minGpa) {
                    result.push_back(s);
                }
            }
        }
        // Sort by GPA descending
        std::sort(result.begin(), result.end(),
                  [](const StudentPtr& a, const StudentPtr& b) {
                      return a->gpa().value() > b->gpa().value();
                  });
        return result;
    }

private:
    std::unordered_map<Department, std::vector<StudentPtr>> students_;
    size_t count_ = 0;
};

// Helper to convert department to string
const char* deptToString(Department d) {
    switch (d) {
        case Department::ComputerScience: return "Computer Science";
        case Department::Mathematics:     return "Mathematics";
        case Department::Physics:         return "Physics";
        case Department::Engineering:     return "Engineering";
        default:                          return "Unknown";
    }
}

} // namespace university

int main() {
    using namespace university;

    Roster roster;

    // Create students with smart pointers
    auto alice = std::make_shared<Student>("Alice Kim", 21, Department::ComputerScience);
    alice->addGrade("Algorithms", 92.5, 4);
    alice->addGrade("Databases", 88.0, 3);
    alice->addGrade("OS", 45.0, 3);

    auto bob = std::make_shared<Student>("Bob Park", 22, Department::Mathematics);
    bob->addGrade("Linear Algebra", 95.0, 4);
    bob->addGrade("Real Analysis", 78.5, 4);

    auto carol = std::make_shared<Student>("Carol Lee", 20, Department::Physics);
    carol->addGrade("Quantum Mechanics", 67.0, 4);
    carol->addGrade("Thermodynamics", 55.0, 3);

    roster.enroll(alice);
    roster.enroll(bob);
    roster.enroll(carol);

    std::cout << "=== All Students ===" << std::endl;
    roster.forEach([](const Student& s) {
        std::cout << s << " | GPA: ";
        if (auto g = s.gpa(); g.has_value()) {
            std::cout << g.value();
        } else {
            std::cout << "N/A";
        }
        std::cout << '\n';
    });

    // Top students
    std::cout << "\n=== Honor Roll (GPA >= 80) ===" << std::endl;
    for (const auto& s : roster.topStudents(80.0)) {
        std::cout << "  " << s->name()
                  << " (" << deptToString(s->department()) << ")"
                  << " - GPA: " << s->gpa().value() << '\n';
    }

    // Check failed courses
    std::cout << "\n=== Failed Courses ===" << std::endl;
    roster.forEach([](const Student& s) {
        auto failed = s.failedCourses();
        if (!failed.empty()) {
            std::cout << s.name() << ":\n";
            for (const auto& g : failed) {
                std::cout << "  - " << g.course
                          << " (" << g.score << ")\n";
            }
        }
    });

    return 0;
}
