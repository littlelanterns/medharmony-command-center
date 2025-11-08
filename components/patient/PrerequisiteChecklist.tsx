import Card from '@/components/ui/Card';
import { Prerequisite } from '@/lib/types';

interface PrerequisiteChecklistProps {
  prerequisites: Prerequisite[];
  title?: string;
}

export default function PrerequisiteChecklist({
  prerequisites,
  title = 'Prerequisites',
}: PrerequisiteChecklistProps) {
  if (!prerequisites || prerequisites.length === 0) {
    return null;
  }

  return (
    <Card>
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <div className="space-y-3">
        {prerequisites.map((prereq) => (
          <div key={prereq.id} className="flex items-start p-3 bg-blue-50 rounded-lg">
            <svg
              className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <div className="font-semibold text-gray-800">{prereq.description}</div>
              <div className="text-sm text-gray-600 mt-1">
                Type: {prereq.prerequisite_type}
                {prereq.is_required && <span className="ml-2 text-red-600 font-semibold">• Required</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
