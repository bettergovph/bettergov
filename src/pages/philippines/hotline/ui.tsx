import Button from '../../../components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../components/ui/dialog';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../components/ui/form';
import { cn } from '../../../lib/utils';
import { useSendOutdatedHotlineReport } from './api';
import { Input } from '../../../components/ui/input';
import { useEffect, useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { TooltipWrapper } from '../../../components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import useHotlinesData, { Hotline } from './hotlines-data';

const reportSchema = z
  .object({
    organizationId: z.string().nonempty('Choose an organization'),
    outdated_hotline: z
      .string()
      .nonempty('Choose the outdated hotline you wish to report'),
    updated_hotline: z.string().nonempty('Ensure that this field is not empty'),
  })
  .refine(data => data.outdated_hotline !== data.updated_hotline, {
    path: ['updated_hotline'],
    message: 'The updated hotline must be different from the current one',
  });

const ReportModal: React.FC = () => {
  const { sendOutdatedHotlineReport, isError, isLoading } =
    useSendOutdatedHotlineReport();

  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      organizationId: '',
      outdated_hotline: '',
      updated_hotline: '',
    },
  });

  const { getHotlines, getHotlineById } = useHotlinesData();
  const [hotline, setHotline] = useState<Hotline | null>(null);

  useEffect(() => {
    if (!isError) return;
    setOpen(true);
  }, [setOpen, isError]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipWrapper
        content='Report a Hotline'
        sideOffset={5}
        delayDuration={300}
      >
        <DialogTrigger asChild>
          <Button
            variant='ghost'
            className='fixed bottom-6 right-6 rounded-full shadow-xl px-4 py-6 bg-blue-600 hover:bg-blue-700 text-white transition-transform transform hover:scale-110 focus:ring-4 focus:ring-blue-300'
            aria-label='Send a Report'
          >
            <Mail className='h-10 w-5' />
          </Button>
        </DialogTrigger>
      </TooltipWrapper>

      <DialogContent className='bg-white w-full'>
        <DialogHeader>
          <DialogTitle className='text-xl font-semibold text-gray-900'>
            Send a Report
          </DialogTitle>
          <DialogDescription className='text-gray-800 mt-1'>
            Help us keep the hotline information accurate. Please provide the
            updated details below.
          </DialogDescription>
        </DialogHeader>
        <div className='w-full truncate px-1'>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(async data => {
                const payload = {
                  organization: hotline!.name,
                  outdated_hotline: data.outdated_hotline,
                  updated_hotline: data.updated_hotline,
                };
                await sendOutdatedHotlineReport(payload);
                setOpen(false);
              })}
              className='space-y-8'
            >
              <FormField
                control={form.control}
                name='organizationId'
                render={({ field }) => (
                  <FormItem>
                    <div className='flex justify-between'>
                      <FormLabel>Organization</FormLabel>
                      <FormMessage />
                    </div>
                    <Select
                      onValueChange={value => {
                        const hotline = getHotlineById(value);
                        setHotline(hotline!);
                        field.onChange(hotline!.id!);
                      }}
                      value={field.value}
                      name='organizationId'
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Choose the organization' />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent className='w-[500px]'>
                        {getHotlines().map(hotline => (
                          <SelectItem
                            value={hotline.id!}
                            key={hotline.id}
                            className='w-full truncate'
                          >
                            {hotline.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='outdated_hotline'
                render={({ field }) => (
                  <FormItem>
                    <div className='flex justify-between'>
                      <FormLabel>Outdated Hotline</FormLabel>
                      <FormMessage />
                    </div>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? undefined}
                      disabled={!hotline}
                      name='outdated_hotline'
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Choose the outdated number' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className='w-[500px]'>
                        {hotline?.numbers.map(number => (
                          <SelectItem value={number} key={number}>
                            {number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='updated_hotline'
                render={({ field }) => (
                  <FormItem>
                    <div className='flex justify-between'>
                      <FormLabel>New Hotline</FormLabel>
                      <FormMessage />
                    </div>
                    <FormControl>
                      <Input
                        placeholder='Input the new hotline here'
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className='flex justify-end'>
                <Button
                  type='submit'
                  className={cn(isLoading ?? 'animate-spin')}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className='h-4 w-4 animate-spin' />}
                  {isLoading ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { ReportModal };
